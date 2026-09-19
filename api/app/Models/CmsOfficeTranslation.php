<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsOfficeTranslation extends Model
{
    protected $fillable = [
        'cms_office_id',
        'locale',
        'url_path',
        'short_path',
        'name',
        'card',
        'detail',
        'breadcrumb',
        'meta',
    ];

    protected $casts = [
        'card' => 'array',
        'detail' => 'array',
        'breadcrumb' => 'array',
        'meta' => 'array',
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(CmsOffice::class, 'cms_office_id');
    }
}
