<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsConsultant extends Model
{
    protected $fillable = [
        'external_id',
        'slug',
        'office_id',
        'city_id',
        'first_name',
        'last_name',
        'has_full_detail',
        'published',
        'list_rank',
    ];

    protected $casts = [
        'external_id' => 'integer',
        'has_full_detail' => 'boolean',
        'published' => 'boolean',
        'list_rank' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsConsultantTranslation::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ConsultantComment::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }
}
