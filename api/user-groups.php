<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

require_method("POST");
require_admin($pdo);

$data = read_json_body();
$username = trim((string) ($data["username"] ?? ""));
$groups = normalize_group_names((array) ($data["groups"] ?? []));

if ($username === "") {
    respond_json([
        "message" => "Benutzer wurde nicht gefunden."
    ], 422);
}

$user = fetch_user_by_username($pdo, $username);

if (!$user) {
    respond_json([
        "message" => "Benutzer wurde nicht gefunden."
    ], 404);
}

sync_user_groups($pdo, (int) $user["id"], $groups);
$updatedUser = fetch_user_by_id($pdo, (int) $user["id"]);

respond_json([
    "user" => format_user($pdo, $updatedUser ?: $user)
]);
