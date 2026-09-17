<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsArticle extends Model
{
    protected $fillable = ['type', 'external_id', 'published', 'position'];

    protected $casts = [
        'external_id' => 'integer',
        'published' => 'boolean',
        'position' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsArticleTranslation::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }
}
