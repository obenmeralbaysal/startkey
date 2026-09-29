<?php

namespace App\Services;

use App\Models\LookupItem;

class LookupLabel
{
    public function find(string $group, int $externalId, string $locale): ?string
    {
        $item = LookupItem::query()
            ->where('group', $group)
            ->where('external_id', (string) $externalId)
            ->with(['translations' => fn ($query) => $query->where('locale', $locale)])
            ->first();

        $label = $item?->translations->first()?->label;

        return is_string($label) && $label !== '' ? $label : null;
    }
}
