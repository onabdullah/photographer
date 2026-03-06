<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'sent_to_email',
        'email_type',
    ];

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}
