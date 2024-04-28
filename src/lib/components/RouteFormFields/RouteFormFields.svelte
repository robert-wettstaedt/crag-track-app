<script lang="ts">
  import type { Route } from '$lib/db/schema'
  import { grades } from '$lib/grades'
  import type { ChangeEventHandler } from 'svelte/elements'

  export let name: Route['name']
  export let grade: Route['grade']
  export let gradingScale: Route['gradingScale'] | undefined

  const onChangeGradingScale: ChangeEventHandler<HTMLSelectElement> = (event) => {
    gradingScale = event.currentTarget.value as Route['gradingScale']
  }
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>

<label class="label mt-4">
  <span>Grading scale</span>
  <select class="select" name="gradingScale" on:change={onChangeGradingScale} size="2" value={gradingScale}>
    <option value="FB">FB</option>
    <option value="V">V</option>
  </select>
</label>

<label class="label mt-4">
  <span>Grade</span>
  <select class="select" name="grade" size="8" value={grade}>
    {#if gradingScale == null}
      <option disabled>Select grading scale first...</option>
    {:else}
      {#each grades as grade}
        <option value={grade[gradingScale]}>{gradingScale} {grade[gradingScale]}</option>
      {/each}
    {/if}
  </select>
</label>
