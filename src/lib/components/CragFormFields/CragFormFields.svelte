<script lang="ts">
  import type { Crag } from '$lib/db/schema'

  export let name: Crag['name']
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>
