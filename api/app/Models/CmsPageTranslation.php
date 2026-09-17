<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsPageTranslation extends Model
{
    protected $fillable = [
        'cms_page_id',
        'locale',
        'url_path',
        'heading',
        'body_html',
        'breadcrumb',
        'meta',
        'payload',
    ];

    protected $casts = [
        'breadcrumb' => 'array',
        'meta' => 'array',
        'payload' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(CmsPage::class, 'cms_page_id');
    }
}
