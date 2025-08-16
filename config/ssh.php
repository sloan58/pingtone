<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SSH Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for SSH connections to UCM servers.
    | These credentials override the UCM database credentials for SSH access.
    |
    */

    'ucm_ssh' => [
        'username' => env('UCM_SSH_USERNAME', 'admin'),
        'password' => env('UCM_SSH_PASSWORD', 'your-ssh-password-here'),
        'port' => env('UCM_SSH_PORT', 22),
    ],
];
