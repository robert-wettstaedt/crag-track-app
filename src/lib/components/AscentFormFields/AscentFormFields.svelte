<script lang="ts">
  import type { Ascent, Boulder } from '$lib/db/schema'
  import { DateTime } from 'luxon'

  export let dateTime: Ascent['dateTime']
  export let gradingScale: Boulder['gradingScale']
  export let grade: Ascent['grade']
  export let notes: Ascent['notes']
  export let type: Ascent['type'] | null
</script>

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

<label class="label mt-4">
  <span>Type</span>
  <select class="select" name="type" size="3" value={type}>
    <option value="flash"><i class="fa-solid fa-bolt-lightning text-yellow-300 me-2" />Flash</option>
    <option value="send"><i class="fa-solid fa-circle text-red-500 me-2" />Send</option>
    <option value="attempt"><i class="fa-solid fa-person-falling text-blue-300 me-2" />Attempt</option>
  </select>
</label>

<label class="label mt-4">
  <span>Date</span>
  <input
    class="input"
    max={DateTime.now().toISODate()}
    name="dateTime"
    title="Input (date)"
    type="date"
    value={DateTime.fromSQL(dateTime).toISODate()}
  />
</label>

<label class="label mt-4">
  <span>Notes</span>
  <textarea class="textarea" name="notes" rows="4" placeholder="Enter some long form content." value={notes} />
</label>
