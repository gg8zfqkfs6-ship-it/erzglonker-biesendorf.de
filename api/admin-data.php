<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

require_admin($pdo);

$groups = $pdo->query("SELECT name FROM member_groups ORDER BY name ASC")->fetchAll();
$users = $pdo->query("SELECT * FROM users ORDER BY display_name ASC, username ASC")->fetchAll();

respond_json([
    "groups" => array_map(
        static fn (array $row): string => (string) $row["name"],
        $groups
    ),
    "users" => array_map(
        static fn (array $user): array => format_user($pdo, $user),
        $users
    )
]);
