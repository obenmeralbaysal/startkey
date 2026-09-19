<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsConsultantTranslation extends Model
{
    protected $fillable = [
        'cms_consultant_id',
        'locale',
        'url_path',
        'name',
        'role',
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

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(CmsConsultant::class, 'cms_consultant_id');
    }
}
