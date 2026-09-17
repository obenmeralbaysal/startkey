<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    protected $fillable = ['first_name', 'last_name', 'email', 'locale', 'ip_address'];
}
