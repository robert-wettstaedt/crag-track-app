<script lang="ts">
  import type { Block } from '$lib/db/schema'

  interface Props {
    name: Block['name']
    withFiles?: boolean
  }

  let { name, withFiles = false }: Props = $props()
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>

{#if withFiles}
  <label class="label mt-4">
    <span>Topo images</span>
    <input class="input" name="imageFiles" type="file" accept="image/*" multiple />
  </label>
{/if}
