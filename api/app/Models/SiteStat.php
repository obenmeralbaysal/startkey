<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteStat extends Model
{
    protected $fillable = ['key', 'icon', 'value', 'suffix', 'position'];

    protected $casts = ['value' => 'integer', 'position' => 'integer'];

    public function translations(): HasMany
    {
        return $this->hasMany(SiteStatTranslation::class);
    }
}
