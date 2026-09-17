<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LookupItem extends Model
{
    protected $fillable = ['group', 'external_id', 'parent_external_id', 'position'];

    protected $casts = ['position' => 'integer'];

    public function translations(): HasMany
    {
        return $this->hasMany(LookupItemTranslation::class);
    }
}
