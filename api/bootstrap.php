<?php

declare(strict_types=1);

session_name("erzglonker_session");
session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
    "httponly" => true,
    "samesite" => "Lax"
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function respond_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents("php://input");

    if ($raw === false || trim($raw) === "") {
        return [];
    }

    $data = json_decode($raw, true);

    if (!is_array($data)) {
        respond_json([
            "message" => "Die Anfrage konnte nicht gelesen werden."
        ], 400);
    }

    return $data;
}

function require_method(string $expectedMethod): void
{
    if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== $expectedMethod) {
        respond_json([
            "message" => "Diese Aktion ist mit der aktuellen Methode nicht erlaubt."
        ], 405);
    }
}

function load_config(): array
{
    $configPath = dirname(__DIR__) . "/config.php";

    if (!is_file($configPath)) {
        respond_json([
            "message" => "config.php fehlt. Bitte die Datenbankverbindung auf dem Server eintragen."
        ], 500);
    }

    $config = require $configPath;

    if (!is_array($config) || !isset($config["db"]) || !is_array($config["db"])) {
        respond_json([
            "message" => "Die Datenbankkonfiguration ist unvollständig."
        ], 500);
    }

    return $config;
}

function connect_pdo(array $db): PDO
{
    foreach (["host", "port", "name", "user", "password"] as $requiredKey) {
        if (!array_key_exists($requiredKey, $db)) {
            respond_json([
                "message" => "In config.php fehlt der Wert '{$requiredKey}'."
            ], 500);
        }
    }

    try {
        return new PDO(
            sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
                $db["host"],
                $db["port"],
                $db["name"]
            ),
            (string) $db["user"],
            (string) $db["password"],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    } catch (Throwable $exception) {
        respond_json([
            "message" => "Die Verbindung zur MySQL-Datenbank ist fehlgeschlagen."
        ], 500);
    }
}

function ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(120) NOT NULL UNIQUE,
            display_name VARCHAR(160) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_admin TINYINT(1) NOT NULL DEFAULT 0,
            must_change_password TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS member_groups (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS user_group_memberships (
            user_id INT UNSIGNED NOT NULL,
            group_id INT UNSIGNED NOT NULL,
            PRIMARY KEY (user_id, group_id),
            CONSTRAINT fk_user_group_memberships_user
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_user_group_memberships_group
                FOREIGN KEY (group_id) REFERENCES member_groups(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function seed_defaults(PDO $pdo): void
{
    $groupInsert = $pdo->prepare("INSERT IGNORE INTO member_groups (name) VALUES (:name)");

    foreach (["Narren", "Vorstandschaft"] as $groupName) {
        $groupInsert->execute([
            "name" => $groupName
        ]);
    }

    $existingAdmin = $pdo->query("SELECT id FROM users WHERE username = 'admin' LIMIT 1")->fetch();

    if ($existingAdmin) {
        return;
    }

    $insertAdmin = $pdo->prepare(
        "INSERT INTO users (username, display_name, password_hash, is_admin, must_change_password)
         VALUES (:username, :display_name, :password_hash, 1, 1)"
    );

    $insertAdmin->execute([
        "username" => "admin",
        "display_name" => "Admin",
        "password_hash" => password_hash("1234", PASSWORD_DEFAULT)
    ]);

    $adminId = (int) $pdo->lastInsertId();
    $groupId = (int) $pdo->query("SELECT id FROM member_groups WHERE name = 'Vorstandschaft' LIMIT 1")->fetchColumn();

    if ($adminId > 0 && $groupId > 0) {
        $membership = $pdo->prepare(
            "INSERT IGNORE INTO user_group_memberships (user_id, group_id) VALUES (:user_id, :group_id)"
        );
        $membership->execute([
            "user_id" => $adminId,
            "group_id" => $groupId
        ]);
    }
}

function fetch_user_groups(PDO $pdo, int $userId): array
{
    $statement = $pdo->prepare(
        "SELECT g.name
         FROM member_groups g
         INNER JOIN user_group_memberships ugm ON ugm.group_id = g.id
         WHERE ugm.user_id = :user_id
         ORDER BY g.name ASC"
    );
    $statement->execute([
        "user_id" => $userId
    ]);

    return array_map(
        static fn (array $row): string => (string) $row["name"],
        $statement->fetchAll()
    );
}

function fetch_user_by_id(PDO $pdo, int $userId): ?array
{
    $statement = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $statement->execute([
        "id" => $userId
    ]);
    $user = $statement->fetch();

    return $user ?: null;
}

function fetch_user_by_username(PDO $pdo, string $username): ?array
{
    $statement = $pdo->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
    $statement->execute([
        "username" => trim($username)
    ]);
    $user = $statement->fetch();

    return $user ?: null;
}

function format_user(PDO $pdo, array $user): array
{
    return [
        "username" => (string) $user["username"],
        "displayName" => (string) $user["display_name"],
        "isAdmin" => (bool) $user["is_admin"],
        "mustChangePassword" => (bool) $user["must_change_password"],
        "groups" => fetch_user_groups($pdo, (int) $user["id"])
    ];
}

function current_user(PDO $pdo): ?array
{
    $userId = $_SESSION["user_id"] ?? null;

    if (!$userId) {
        return null;
    }

    $user = fetch_user_by_id($pdo, (int) $userId);

    if (!$user) {
        unset($_SESSION["user_id"]);
        return null;
    }

    return $user;
}

function require_user(PDO $pdo, bool $allowPasswordChange = false): array
{
    $user = current_user($pdo);

    if (!$user) {
        respond_json([
            "message" => "Bitte zuerst einloggen."
        ], 401);
    }

    if (!$allowPasswordChange && (bool) $user["must_change_password"]) {
        respond_json([
            "message" => "Bitte zuerst das Passwort ändern."
        ], 403);
    }

    return $user;
}

function require_admin(PDO $pdo): array
{
    $user = require_user($pdo);

    if (!(bool) $user["is_admin"]) {
        respond_json([
            "message" => "Diese Aktion ist nur für Admins erlaubt."
        ], 403);
    }

    return $user;
}

function validate_password(string $password): void
{
    if (strlen(trim($password)) < 6) {
        respond_json([
            "message" => "Das Passwort muss mindestens 6 Zeichen lang sein."
        ], 422);
    }
}

function normalize_group_names(array $groups): array
{
    $cleanGroups = [];

    foreach ($groups as $group) {
        $value = trim((string) $group);
        if ($value !== "") {
            $cleanGroups[$value] = $value;
        }
    }

    return array_values($cleanGroups);
}

function sync_user_groups(PDO $pdo, int $userId, array $groupNames): void
{
    $normalizedGroups = normalize_group_names($groupNames);
    $pdo->prepare("DELETE FROM user_group_memberships WHERE user_id = :user_id")->execute([
        "user_id" => $userId
    ]);

    if ($normalizedGroups === []) {
        return;
    }

    $groupLookup = $pdo->prepare("SELECT id FROM member_groups WHERE name = :name LIMIT 1");
    $membershipInsert = $pdo->prepare(
        "INSERT INTO user_group_memberships (user_id, group_id) VALUES (:user_id, :group_id)"
    );

    foreach ($normalizedGroups as $groupName) {
        $groupLookup->execute([
            "name" => $groupName
        ]);
        $groupId = $groupLookup->fetchColumn();

        if (!$groupId) {
            respond_json([
                "message" => "Die Gruppe '{$groupName}' existiert nicht."
            ], 422);
        }

        $membershipInsert->execute([
            "user_id" => $userId,
            "group_id" => (int) $groupId
        ]);
    }
}

$config = load_config();
$pdo = connect_pdo($config["db"]);
ensure_schema($pdo);
seed_defaults($pdo);
