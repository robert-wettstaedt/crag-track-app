<script lang="ts">
  import type { FirstAscent } from '$lib/db/schema'
  import { Combobox } from '@skeletonlabs/skeleton-svelte'

  interface Props {
    climbers: string[]
    climberName: FirstAscent['climberName'] | undefined
    year: FirstAscent['year'] | undefined
  }

  let { climbers, climberName = $bindable(), year }: Props = $props()

  let climberNameValue = $state(climberName == null ? [] : [climberName])
</script>

<label class="label">
  <span>Climber</span>

  <Combobox
    allowCustomValue
    bind:value={climberNameValue}
    data={climbers.map((climber) => ({ label: climber, value: climber }))}
    name="climberName"
    placeholder="Search..."
  />
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
