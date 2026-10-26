<?php

namespace App\Support;

/** ASCII-lower folding for Turkish search (İ/I/ı, ş, ğ, ü, ö, ç). */
final class TurkishFold
{
    public static function fold(string $value): string
    {
        $value = strtr($value, [
            'İ' => 'i', 'I' => 'i', 'ı' => 'i',
            'Ş' => 's', 'ş' => 's',
            'Ğ' => 'g', 'ğ' => 'g',
            'Ü' => 'u', 'ü' => 'u',
            'Ö' => 'o', 'ö' => 'o',
            'Ç' => 'c', 'ç' => 'c',
        ]);

        return mb_strtolower($value, 'UTF-8');
    }
}
