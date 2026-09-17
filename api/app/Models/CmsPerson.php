<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsPerson extends Model
{
    protected $fillable = [
        'external_id',
        'image',
        'image_webp',
        'detail_image',
        'detail_image_webp',
        'email',
        'phone_href',
        'social',
        'published',
        'position',
    ];

    protected $casts = [
        'external_id' => 'integer',
        'social' => 'array',
        'published' => 'boolean',
        'position' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsPersonTranslation::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }
}
