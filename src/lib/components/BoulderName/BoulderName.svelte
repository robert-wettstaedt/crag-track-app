<script lang="ts">
  import type { Boulder } from '$lib/db/schema'
  import { grades } from '$lib/grades'

  export let boulder: Boulder | undefined

  const index = grades.findIndex((grade) => (boulder == null ? false : grade[boulder.gradingScale] === boulder.grade))
  const color = index < 6 ? 'bg-amber-500' : index < 14 ? 'bg-red-700' : 'bg-purple-900'
</script>

{#if boulder != null}
  <span>
    {#if boulder.grade != null}
      &nbsp;<span class={`badge text-white ${color}`}>{boulder.gradingScale} {boulder.grade}</span>&nbsp;
    {/if}

    {boulder.name}
  </span>
{/if}
