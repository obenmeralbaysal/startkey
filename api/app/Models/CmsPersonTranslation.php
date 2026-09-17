<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsPersonTranslation extends Model
{
    protected $fillable = [
        'cms_person_id',
        'locale',
        'url_path',
        'name',
        'role',
        'phone_label',
        'email_label',
        'phone_field_label',
        'bio_heading',
        'bio_html',
        'breadcrumb',
        'meta',
    ];

    protected $casts = [
        'breadcrumb' => 'array',
        'meta' => 'array',
    ];

    public function person(): BelongsTo
    {
        return $this->belongsTo(CmsPerson::class, 'cms_person_id');
    }
}
