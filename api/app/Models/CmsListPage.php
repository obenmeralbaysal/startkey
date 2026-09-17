<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsListPage extends Model
{
    protected $fillable = [
        'type',
        'locale',
        'url_path',
        'pager_base',
        'per_page',
        'continue_label',
        'heading',
        'breadcrumb',
        'meta',
        'sidebar',
    ];

    protected $casts = [
        'per_page' => 'integer',
        'breadcrumb' => 'array',
        'meta' => 'array',
        'sidebar' => 'array',
    ];
}
