<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

require_method("POST");

$data = read_json_body();
$username = trim((string) ($data["username"] ?? ""));
$password = (string) ($data["password"] ?? "");

if ($username === "" || $password === "") {
    respond_json([
        "message" => "Bitte Benutzername und Passwort eingeben."
    ], 422);
}

$user = fetch_user_by_username($pdo, $username);

if (!$user || !password_verify($password, (string) $user["password_hash"])) {
    respond_json([
        "message" => "Benutzername oder Passwort ist nicht korrekt."
    ], 401);
}

session_regenerate_id(true);
$_SESSION["user_id"] = (int) $user["id"];

respond_json([
    "mode" => "api",
    "user" => format_user($pdo, $user)
]);
