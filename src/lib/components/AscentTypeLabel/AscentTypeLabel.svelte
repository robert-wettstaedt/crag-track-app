<script lang="ts">
  import type { Ascent } from '$lib/db/schema'

  export let ascent: Ascent
</script>

{#if ascent.type === 'flash'}
  <i class="fa-solid fa-bolt-lightning text-yellow-300 me-2" />Flash
{:else if ascent.type === 'send'}
  <i class="fa-solid fa-circle text-red-500 me-2" />Send
{:else}
  <i class="fa-solid fa-person-falling text-blue-300 me-2" />Attempt
{/if}
