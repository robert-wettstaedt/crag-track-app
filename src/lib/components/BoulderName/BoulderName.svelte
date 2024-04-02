<script lang="ts">
  import type { Boulder } from '$lib/db/schema'
  import { grades } from '$lib/grades'

  export let boulder: Boulder | undefined

  const grade = grades.find((grade) => (boulder == null ? false : grade[boulder.gradingScale] === boulder.grade))
</script>

{#if boulder != null}
  <span>
    {#if boulder.grade != null}
      &nbsp;<span class={`badge text-white`} style={`background: ${grade?.color}`}
        >{boulder.gradingScale} {boulder.grade}</span
      >&nbsp;
    {/if}

    {boulder.name}
  </span>
{/if}
