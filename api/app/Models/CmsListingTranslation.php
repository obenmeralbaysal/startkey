<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsListingTranslation extends Model
{
    protected $fillable = [
        'cms_listing_id',
        'locale',
        'url_path',
        'title',
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

    public function listing(): BelongsTo
    {
        return $this->belongsTo(CmsListing::class, 'cms_listing_id');
    }
}
