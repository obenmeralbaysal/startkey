<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingApplication extends Model
{
    protected $fillable = [
        'cms_training_id',
        'locale',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender_id',
        'ip_address',
    ];

    protected $casts = [
        'gender_id' => 'integer',
    ];

    public function training(): BelongsTo
    {
        return $this->belongsTo(CmsTraining::class, 'cms_training_id');
    }
}
