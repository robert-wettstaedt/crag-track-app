<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import { grades } from '$lib/grades'

  export let route: InferResultType<'routes', { ascents: true }> | undefined

  const send = route?.ascents.find((ascent) => ascent.type === 'send')

  const routeGradeConfig = grades.find((grade) => (route == null ? false : grade[route.gradingScale] === route.grade))
  const ascentGradeConfig = grades.find((grade) =>
    route == null || route.ascents == null ? false : grade[route.gradingScale] === send?.grade,
  )
</script>

{#if route?.grade != null}
  <span class={`badge text-white`} style={`background: ${ascentGradeConfig?.color ?? routeGradeConfig?.color}`}>
    {#if send?.grade == null || send.grade === route.grade}
      {route.gradingScale}
      {route.grade}
    {:else}
      <s>
        {route.gradingScale}
        {route.grade}
      </s>

      &nbsp;

      {route.gradingScale}
      {send.grade}
    {/if}
  </span>
{/if}
