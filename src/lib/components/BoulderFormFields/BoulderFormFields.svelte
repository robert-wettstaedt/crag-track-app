<script lang="ts">
  import type { Boulder } from '$lib/db/schema'
  import type { ChangeEventHandler } from 'svelte/elements'

  export let name: Boulder['name']
  export let grade: Boulder['grade']
  export let gradingScale: Boulder['gradingScale']

  const onChangeGradingScale: ChangeEventHandler<HTMLSelectElement> = (event) => {
    gradingScale = event.currentTarget.value as Boulder['gradingScale']
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
    {#if gradingScale === 'FB'}
      <option value="5A">{gradingScale} 5A</option>
      <option value="5B">{gradingScale} 5B</option>
      <option value="5C">{gradingScale} 5C</option>
      <option value="6A">{gradingScale} 6A</option>
      <option value="6A+">{gradingScale} 6A+</option>
      <option value="6B">{gradingScale} 6B</option>
      <option value="6B+">{gradingScale} 6B+</option>
      <option value="6C">{gradingScale} 6C</option>
      <option value="6C+">{gradingScale} 6C+</option>
      <option value="7A">{gradingScale} 7A</option>
      <option value="7A+">{gradingScale} 7A+</option>
      <option value="7B">{gradingScale} 7B</option>
      <option value="7B+">{gradingScale} 7B+</option>
      <option value="7C">{gradingScale} 7C</option>
      <option value="7C+">{gradingScale} 7C+</option>
      <option value="8A">{gradingScale} 8A</option>
      <option value="8A+">{gradingScale} 8A+</option>
    {:else if gradingScale === 'V'}
      <option value="0">{gradingScale} 0</option>
      <option value="1">{gradingScale} 1</option>
      <option value="2">{gradingScale} 2</option>
      <option value="3">{gradingScale} 3</option>
      <option value="4">{gradingScale} 4</option>
      <option value="5">{gradingScale} 5</option>
      <option value="6">{gradingScale} 6</option>
      <option value="7">{gradingScale} 7</option>
      <option value="8">{gradingScale} 8</option>
      <option value="9">{gradingScale} 9</option>
      <option value="10">{gradingScale} 10</option>
      <option value="11">{gradingScale} 11</option>
      <option value="12">{gradingScale} 12</option>
      <option value="13">{gradingScale} 13</option>
    {:else}
      <option disabled>Select grading scale first...</option>
    {/if}
  </select>
</label>
