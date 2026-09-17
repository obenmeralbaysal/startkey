<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsTrainingTranslation extends Model
{
    protected $fillable = [
        'cms_training_id',
        'locale',
        'url_path',
        'card_url_path',
        'title',
        'list_image',
        'info_lines',
        'detail_label',
        'date_prefix',
        'date_value',
        'time_prefix',
        'time_value',
        'price_prefix',
        'price_value',
        'image',
        'location_heading',
        'location_value',
        'description_heading',
        'description_html',
        'form_heading',
        'form',
        'related_heading',
        'related',
        'page_heading',
        'breadcrumb',
        'meta',
    ];

    protected $casts = [
        'info_lines' => 'array',
        'form' => 'array',
        'related' => 'array',
        'breadcrumb' => 'array',
        'meta' => 'array',
    ];

    public function training(): BelongsTo
    {
        return $this->belongsTo(CmsTraining::class, 'cms_training_id');
    }
}
