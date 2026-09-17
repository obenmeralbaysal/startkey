<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsChampionGroup extends Model
{
    protected $fillable = ['published', 'position'];

    protected $casts = [
        'published' => 'boolean',
        'position' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsChampionGroupTranslation::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(CmsChampionPhoto::class)->orderBy('position');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }
}
