<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultantComment extends Model
{
    protected $fillable = [
        'cms_consultant_id',
        'locale',
        'first_name',
        'last_name',
        'email',
        'phone',
        'rating',
        'comment',
        'ip_address',
    ];

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(CmsConsultant::class, 'cms_consultant_id');
    }
}
