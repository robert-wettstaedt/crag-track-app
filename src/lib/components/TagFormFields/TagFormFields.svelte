<script lang="ts">
  import type { Tag } from '$lib/db/schema'

  interface Props {
    id: Tag['id']
  }

  let { id }: Props = $props()
</script>

<label class="label">
  <span>ID</span>
  <input class="input" name="id" type="text" placeholder="Enter ID..." value={id} />
</label>
