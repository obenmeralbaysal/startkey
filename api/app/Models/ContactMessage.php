<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'locale',
        'name',
        'surname',
        'email',
        'phone',
        'subject',
        'message',
        'ip_address',
    ];
}
