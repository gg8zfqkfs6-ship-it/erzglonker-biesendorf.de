<?php

declare(strict_types=1);

require __DIR__ . "/bootstrap.php";

$user = current_user($pdo);

respond_json([
    "mode" => "api",
    "authenticated" => $user !== null,
    "user" => $user ? format_user($pdo, $user) : null
]);
