<script lang="ts">
  import type { Ascent, Boulder } from '$lib/db/schema'
  import { grades } from '$lib/grades'

  export let boulder: Boulder | undefined
  export let ascent: Ascent | undefined

  const boulderGradeConfig = grades.find((grade) =>
    boulder == null ? false : grade[boulder.gradingScale] === boulder.grade,
  )
  const ascentGradeConfig = grades.find((grade) =>
    boulder == null || ascent == null ? false : grade[boulder.gradingScale] === ascent.grade,
  )
</script>

{#if boulder != null}
  <span>
    {#if boulder.grade != null}
      &nbsp;
      <span class={`badge text-white`} style={`background: ${ascentGradeConfig?.color ?? boulderGradeConfig?.color}`}>
        {#if ascent?.grade == null || ascent.grade === boulder.grade}
          {boulder.gradingScale}
          {boulder.grade}
        {:else}
          <s>
            {boulder.gradingScale}
            {boulder.grade}
          </s>

          &nbsp;

          {boulder.gradingScale}
          {ascent.grade}
        {/if}
      </span>
      &nbsp;
    {/if}

    {boulder.name}
  </span>
{/if}
