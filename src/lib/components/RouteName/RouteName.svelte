<script lang="ts">
  import type { Ascent, Route } from '$lib/db/schema'
  import { grades } from '$lib/grades'
  import { Ratings } from '@skeletonlabs/skeleton'
  import { span } from 'vega'

  export let route: Route | undefined
  export let ascent: Ascent | undefined = undefined

  const routeGradeConfig = grades.find((grade) => (route == null ? false : grade[route.gradingScale] === route.grade))
  const ascentGradeConfig = grades.find((grade) =>
    route == null || ascent == null ? false : grade[route.gradingScale] === ascent.grade,
  )
</script>

{#if route != null}
  <div class="flex gap-x-2">
    {#if route.grade != null}
      <span class={`badge text-white`} style={`background: ${ascentGradeConfig?.color ?? routeGradeConfig?.color}`}>
        {#if ascent?.grade == null || ascent.grade === route.grade}
          {route.gradingScale}
          {route.grade}
        {:else}
          <s>
            {route.gradingScale}
            {route.grade}
          </s>

          {route.gradingScale}
          {ascent.grade}
        {/if}
      </span>
    {/if}

    {#if route.rating != null}
      <div>
        <Ratings justify="start" max={3} spacing="" value={route.rating}>
          <svelte:fragment slot="full"><i class="fa-solid fa-star text-warning-500" /></svelte:fragment>
        </Ratings>
      </div>
    {/if}

    {route.name.length === 0 ? '<no name>' : route.name}
  </div>
{/if}
