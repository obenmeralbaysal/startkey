<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsTraining extends Model
{
    protected $fillable = ['external_id', 'group', 'published', 'position'];

    protected $casts = [
        'external_id' => 'integer',
        'published' => 'boolean',
        'position' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsTrainingTranslation::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(TrainingApplication::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }
}
