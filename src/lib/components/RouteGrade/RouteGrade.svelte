<script lang="ts">
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { getGradeColor } from '$lib/grades'

  type RouteWithAscents = InferResultType<'routes', { ascents: true }>

  export let route: (Omit<RouteWithAscents, 'ascents'> & Partial<Pick<RouteWithAscents, 'ascents'>>) | undefined
  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] = 'FB'

  const send = route?.ascents?.find((ascent) => ascent.type === 'send')

  const routeGradeConfig = grades.find((grade) => (route == null ? false : grade.id === route?.gradeFk))
  const ascentGradeConfig = grades.find((grade) =>
    route == null || route.ascents == null ? false : grade.id === send?.gradeFk,
  )
  const gradeConfig = ascentGradeConfig ?? routeGradeConfig
</script>

{#if route?.gradeFk != null}
  <span class="badge text-white" style={gradeConfig == null ? undefined : `background: ${getGradeColor(gradeConfig)}`}>
    {#if send?.gradeFk == null || send.gradeFk === route.gradeFk}
      {routeGradeConfig?.[gradingScale]}
    {:else}
      <s>
        {routeGradeConfig?.[gradingScale]}
      </s>

      &nbsp;

      {ascentGradeConfig?.[gradingScale]}
    {/if}
  </span>
{/if}
