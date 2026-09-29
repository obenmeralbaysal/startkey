<?php

namespace App\Services;

use RuntimeException;

class ReonixException extends RuntimeException
{
    public function __construct(public readonly string $error, public readonly int $status = 422)
    {
        parent::__construct($error);
    }
}
