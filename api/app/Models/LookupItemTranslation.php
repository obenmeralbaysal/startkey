<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LookupItemTranslation extends Model
{
    protected $fillable = ['lookup_item_id', 'locale', 'label'];
}
