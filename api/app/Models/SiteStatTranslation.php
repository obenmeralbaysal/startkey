<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteStatTranslation extends Model
{
    protected $fillable = ['site_stat_id', 'locale', 'label'];
}
