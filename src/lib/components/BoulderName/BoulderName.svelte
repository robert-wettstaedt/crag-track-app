<script lang="ts">
  import type { Boulder } from '$lib/db/schema'

  export let boulder: Boulder
</script>

<span>
  {#if boulder.grade != null}
    &nbsp;<span class="badge variant-filled">{boulder.gradingScale} {boulder.grade}</span>&nbsp;
  {/if}

  {boulder.name}
</span>
