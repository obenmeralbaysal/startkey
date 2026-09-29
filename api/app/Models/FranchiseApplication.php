<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FranchiseApplication extends Model
{
    protected $fillable = [
        'external_id',
        'locale',
        'first_name',
        'last_name',
        'email',
        'phone',
        'city_id',
        'county_id',
        'notes',
        'ip_address',
    ];

    protected $casts = [
        'city_id' => 'integer',
        'county_id' => 'integer',
    ];
}
