<script lang="ts">
  import type { Area, Grade, UserSettings } from '$lib/db/schema'
  import MarkdownEditor from '../MarkdownEditor'

  export let description: Area['description']
  export let name: Area['name']
  export let type: Area['type']
  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] | null | undefined
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>

<label class="label mt-4">
  <span>Description</span>
  <textarea hidden name="description" value={description} />

  <MarkdownEditor {grades} {gradingScale} value={description} on:change={(event) => (description = event.detail)} />
</label>

<label class="label mt-4">
  <span>Type</span>
  <select class="select" name="type" size="3" value={type}>
    <option value="area">Area</option>
    <option value="crag">Crag</option>
    <option value="sector">Sector</option>
  </select>
</label>
