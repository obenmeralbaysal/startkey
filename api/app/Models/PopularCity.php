<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PopularCity extends Model
{
    protected $fillable = ['city_code', 'image', 'position'];

    protected $casts = ['position' => 'integer'];

    public function translations(): HasMany
    {
        return $this->hasMany(PopularCityTranslation::class);
    }
}
