<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

require_method("POST");
require_admin($pdo);

$data = read_json_body();
$username = trim((string) ($data["username"] ?? ""));
$displayName = trim((string) ($data["displayName"] ?? ""));
$password = (string) ($data["password"] ?? "");
$isAdmin = !empty($data["isAdmin"]);
$groups = normalize_group_names((array) ($data["groups"] ?? []));

if ($username === "" || $displayName === "" || $password === "") {
    respond_json([
        "message" => "Bitte Benutzername, Anzeigename und Passwort ausfüllen."
    ], 422);
}

$existingUser = fetch_user_by_username($pdo, $username);

if ($existingUser) {
    respond_json([
        "message" => "Dieser Benutzername ist bereits vergeben."
    ], 422);
}

$insert = $pdo->prepare(
    "INSERT INTO users (username, display_name, password_hash, is_admin, must_change_password)
     VALUES (:username, :display_name, :password_hash, :is_admin, 1)"
);

$insert->execute([
    "username" => $username,
    "display_name" => $displayName,
    "password_hash" => password_hash($password, PASSWORD_DEFAULT),
    "is_admin" => $isAdmin ? 1 : 0
]);

$userId = (int) $pdo->lastInsertId();
sync_user_groups($pdo, $userId, $groups);

$user = fetch_user_by_id($pdo, $userId);

respond_json([
    "user" => format_user($pdo, $user ?: [
        "id" => $userId,
        "username" => $username,
        "display_name" => $displayName,
        "is_admin" => $isAdmin ? 1 : 0,
        "must_change_password" => 1
    ])
]);
