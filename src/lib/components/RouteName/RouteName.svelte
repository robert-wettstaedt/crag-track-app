<script lang="ts">
  import type { Ascent, Route } from '$lib/db/schema'
  import { grades } from '$lib/grades'

  export let route: Route | undefined
  export let ascent: Ascent | undefined = undefined

  const routeGradeConfig = grades.find((grade) => (route == null ? false : grade[route.gradingScale] === route.grade))
  const ascentGradeConfig = grades.find((grade) =>
    route == null || ascent == null ? false : grade[route.gradingScale] === ascent.grade,
  )
</script>

{#if route != null}
  <span>
    {#if route.grade != null}
      &nbsp;
      <span class={`badge text-white`} style={`background: ${ascentGradeConfig?.color ?? routeGradeConfig?.color}`}>
        {#if ascent?.grade == null || ascent.grade === route.grade}
          {route.gradingScale}
          {route.grade}
        {:else}
          <s>
            {route.gradingScale}
            {route.grade}
          </s>

          &nbsp;

          {route.gradingScale}
          {ascent.grade}
        {/if}
      </span>
      &nbsp;
    {/if}

    {route.name.length === 0 ? '<no name>' : route.name}
  </span>
{/if}
