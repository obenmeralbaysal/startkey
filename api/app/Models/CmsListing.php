<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsListing extends Model
{
    protected $fillable = [
        'external_id',
        'ad_type_id',
        'process_type_id',
        'currency_id',
        'country_id',
        'city_id',
        'county_id',
        'district_id',
        'office_id',
        'consultant_id',
        'office_slug',
        'consultant_slug',
        'price_amount',
        'clean_area',
        'updated_on',
        'latitude',
        'longitude',
        'list_rank',
        'published',
    ];

    protected $casts = [
        'external_id' => 'integer',
        'price_amount' => 'integer',
        'clean_area' => 'integer',
        'list_rank' => 'integer',
        'published' => 'boolean',
        'updated_on' => 'date',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsListingTranslation::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(ListingInquiry::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }
}
