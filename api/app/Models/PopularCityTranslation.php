<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PopularCityTranslation extends Model
{
    protected $fillable = ['popular_city_id', 'locale', 'name', 'url_path'];
}
