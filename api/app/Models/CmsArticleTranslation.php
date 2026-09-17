<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsArticleTranslation extends Model
{
    protected $fillable = [
        'cms_article_id',
        'locale',
        'url_path',
        'title',
        'date_label',
        'category',
        'body_html',
        'image',
        'image_webp',
        'list_image',
        'list_image_webp',
        'list_width',
        'list_height',
        'share_label',
        'breadcrumb',
        'meta',
    ];

    protected $casts = [
        'list_width' => 'integer',
        'list_height' => 'integer',
        'breadcrumb' => 'array',
        'meta' => 'array',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(CmsArticle::class, 'cms_article_id');
    }
}
