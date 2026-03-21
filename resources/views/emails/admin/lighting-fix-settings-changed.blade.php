@component('mail::message')
# Lighting Fix Settings Changed

**Changed by:** {{ $admin->name }} ({{ $admin->email }})

@if ($isReset)
Lighting Fix settings have been **reset to config defaults**.
@else
The following Lighting Fix settings have been updated:

@foreach ($changes as $field => $change)
**{{ ucfirst(str_replace('_', ' ', $field)) }}**
- Before: `{{ is_bool($change['old']) ? ($change['old'] ? 'true' : 'false') : $change['old'] }}`
- After: `{{ is_bool($change['new']) ? ($change['new'] ? 'true' : 'false') : $change['new'] }}`

@endforeach
@endif

Please review these changes to ensure they are intentional.

@component('mail::button', ['url' => config('app.url')])
View Settings
@endcomponent

Thanks
@endcomponent
