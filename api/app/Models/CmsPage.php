<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsPage extends Model
{
    protected $fillable = ['key', 'published', 'position'];

    protected $casts = [
        'published' => 'boolean',
        'position' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CmsPageTranslation::class);
    }
}
