<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsOffice extends Model
{
    protected $fillable = [
        'external_id',
        'short_slug',
        'country_id',
        'city_id',
        'county_id',
        'city_label',
        'county_label',
        'latitude',
        'longitude',
        'list_rank',
        'published',
    ];

    protected $casts = [
        'external_id' => 'integer',
        'list_rank' => 'integer',
        'published' => 'boolean',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsOfficeTranslation::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }
}
