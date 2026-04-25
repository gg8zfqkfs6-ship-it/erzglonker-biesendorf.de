<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

require_method("POST");
require_admin($pdo);

$data = read_json_body();
$name = trim((string) ($data["name"] ?? ""));

if ($name === "") {
    respond_json([
        "message" => "Bitte einen Gruppennamen eingeben."
    ], 422);
}

$statement = $pdo->prepare("SELECT id FROM member_groups WHERE name = :name LIMIT 1");
$statement->execute([
    "name" => $name
]);

if ($statement->fetch()) {
    respond_json([
        "message" => "Diese Gruppe existiert bereits."
    ], 422);
}

$insert = $pdo->prepare("INSERT INTO member_groups (name) VALUES (:name)");
$insert->execute([
    "name" => $name
]);

respond_json([
    "group" => [
        "name" => $name
    ]
]);
