<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyTranslation extends Model
{
    protected $fillable = [
        'property_id',
        'locale',
        'url_path',
        'process_type',
        'ad_sub_type',
        'ad_type',
        'price',
        'title',
        'location',
        'detail_label',
    ];
}
