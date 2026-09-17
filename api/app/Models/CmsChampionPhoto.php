<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsChampionPhoto extends Model
{
    protected $fillable = ['cms_champion_group_id', 'image', 'position'];

    protected $casts = ['position' => 'integer'];

    public function group(): BelongsTo
    {
        return $this->belongsTo(CmsChampionGroup::class, 'cms_champion_group_id');
    }
}
