<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

require_method("POST");

$user = require_user($pdo, true);
$data = read_json_body();
$currentPassword = (string) ($data["currentPassword"] ?? "");
$newPassword = (string) ($data["newPassword"] ?? "");

if (!password_verify($currentPassword, (string) $user["password_hash"])) {
    respond_json([
        "message" => "Das aktuelle Passwort stimmt nicht."
    ], 422);
}

validate_password($newPassword);

if ($currentPassword === $newPassword) {
    respond_json([
        "message" => "Bitte ein neues Passwort verwenden."
    ], 422);
}

$statement = $pdo->prepare(
    "UPDATE users
     SET password_hash = :password_hash,
         must_change_password = 0
     WHERE id = :id"
);

$statement->execute([
    "password_hash" => password_hash($newPassword, PASSWORD_DEFAULT),
    "id" => (int) $user["id"]
]);

$updatedUser = fetch_user_by_id($pdo, (int) $user["id"]);

respond_json([
    "user" => format_user($pdo, $updatedUser ?: $user)
]);
