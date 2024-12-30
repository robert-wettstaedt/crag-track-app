<script lang="ts">
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { getGradeColor } from '$lib/grades'

  type RouteWithAscents = InferResultType<'routes', { ascents: true }>

  interface Props {
    route: (Omit<RouteWithAscents, 'ascents'> & Partial<Pick<RouteWithAscents, 'ascents'>>) | undefined
    grades: Grade[]
    gradingScale?: UserSettings['gradingScale']
  }

  let { route, grades, gradingScale = 'FB' }: Props = $props()

  const send = $derived(route?.ascents?.find((ascent) => ascent.type === 'send'))

  const routeGradeConfig = $derived(grades.find((grade) => (route == null ? false : grade.id === route?.gradeFk)))
  const ascentGradeConfig = $derived(
    grades.find((grade) => (route == null || route.ascents == null ? false : grade.id === send?.gradeFk)),
  )
  const gradeConfig = $derived(ascentGradeConfig ?? routeGradeConfig)
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
