<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingInquiry extends Model
{
    protected $fillable = [
        'cms_listing_id',
        'locale',
        'subject',
        'full_name',
        'email',
        'phone',
        'message',
        'ip_address',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(CmsListing::class, 'cms_listing_id');
    }
}
