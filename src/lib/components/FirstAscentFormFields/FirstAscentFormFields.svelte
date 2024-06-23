<script lang="ts">
  import type { FirstAscent, User } from '$lib/db/schema'
  import { Autocomplete, popup, type AutocompleteOption, type PopupSettings } from '@skeletonlabs/skeleton'

  export let climbers: string[]

  export let climberName: FirstAscent['climberName'] | undefined
  export let year: FirstAscent['year'] | undefined

  function onSelectClimber(event: CustomEvent<AutocompleteOption<string | undefined | null>>): void {
    climberName = event.detail.value
  }

  let popupSettings: PopupSettings = {
    event: 'focus-click',
    target: 'first-ascent-form-climber',
    placement: 'bottom-start',
  }
</script>

<label class="label">
  <span>Climber</span>

  <input
    bind:value={climberName}
    class="input"
    name="climberName"
    placeholder="Search..."
    type="search"
    use:popup={popupSettings}
  />

  <div data-popup="first-ascent-form-climber">
    <div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto" tabindex="-1">
      <Autocomplete
        bind:input={climberName}
        emptyState={climberName ?? undefined}
        on:selection={onSelectClimber}
        options={climbers.map((climber) => ({ label: climber, value: climber }))}
      />
    </div>
  </div>
</label>

<label class="label mt-4">
  <span>Year</span>
  <input
    class="input"
    max={new Date().getFullYear()}
    min={1970}
    name="year"
    placeholder="Enter year..."
    type="number"
    value={year}
  />
</label>
