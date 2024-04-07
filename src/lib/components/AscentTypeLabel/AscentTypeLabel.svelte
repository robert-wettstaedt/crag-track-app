<script lang="ts">
  import type { Ascent } from '$lib/db/schema'

  export let type: Ascent['type']
</script>

{#if type === 'flash'}
  <i class="fa-solid fa-bolt-lightning text-yellow-300 me-2" />Flash
{:else if type === 'send'}
  <i class="fa-solid fa-circle text-red-500 me-2" />Send
{:else if type === 'repeat'}
  <i class="fa-solid fa-repeat text-green-500 me-2" />Repeat
{:else}
  <i class="fa-solid fa-person-falling text-blue-300 me-2" />Attempt
{/if}
