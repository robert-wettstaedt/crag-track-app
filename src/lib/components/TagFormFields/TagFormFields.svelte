<script lang="ts">
  import type { Tag } from '$lib/db/schema'

  export let id: Tag['id']
</script>

<label class="label">
  <span>ID</span>
  <input class="input" name="id" type="text" placeholder="Enter ID..." value={id} />
</label>
