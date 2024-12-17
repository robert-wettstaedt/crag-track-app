<script lang="ts">
  import MarkdownEditor from '$lib/components/MarkdownEditor'
  import type { Area, Grade, UserSettings } from '$lib/db/schema'

  interface Props {
    description: Area['description']
    grades: Grade[]
    gradingScale: UserSettings['gradingScale'] | null | undefined
    hasParent: boolean
    name: Area['name']
    type: Area['type']
  }

  let { description = $bindable(), name, type, grades, gradingScale, hasParent }: Props = $props()
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

{#if hasParent}
  <label class="label mt-4">
    <span>Type</span>
    <select class="select max-h-[300px] overflow-auto" name="type" size="3" value={type}>
      <option value="area">Area</option>
      <option value="crag">Crag</option>
      <option value="sector">Sector</option>
    </select>
  </label>
{/if}
