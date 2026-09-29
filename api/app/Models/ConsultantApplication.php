<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultantApplication extends Model
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
        'office_id',
        'position',
        'notes',
        'ip_address',
    ];
}
