<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppStat extends Model
{
    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
        ];
    }

    public static function incrementKey(string $key, int $by = 1): int
    {
        $stat = self::firstOrCreate(
            ['key' => $key],
            ['value' => 0]
        );
        $stat->increment('value', $by);
        return $stat->fresh()->value;
    }
}
