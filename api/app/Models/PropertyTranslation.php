<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyTranslation extends Model
{
    protected $fillable = [
        'property_id',
        'locale',
        'url_path',
        'process_type',
        'ad_sub_type',
        'ad_type',
        'price',
        'title',
        'location',
        'detail_label',
        'is_featured',
        'featured_position',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'featured_position' => 'integer',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
