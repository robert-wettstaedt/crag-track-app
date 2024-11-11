<script lang="ts">
  import MarkdownEditor from '$lib/components/MarkdownEditor'
  import type { Area, Grade, UserSettings } from '$lib/db/schema'

  interface Props {
    description: Area['description']
    name: Area['name']
    type: Area['type']
    grades: Grade[]
    gradingScale: UserSettings['gradingScale'] | null | undefined
  }

  let { description = $bindable(), name, type, grades, gradingScale }: Props = $props()
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>

<label class="label mt-4">
  <span>Description</span>
  <textarea hidden name="description" value={description}></textarea>

  <MarkdownEditor {grades} {gradingScale} bind:value={description} />
</label>

<label class="label mt-4">
  <span>Type</span>
  <select class="select" name="type" size="3" value={type}>
    <option value="area">Area</option>
    <option value="crag">Crag</option>
    <option value="sector">Sector</option>
  </select>
</label>
