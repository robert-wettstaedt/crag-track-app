<script lang="ts">
  import { page } from '$app/stores'
  import type { InferResultType } from '$lib/db/types'
  import { getGradeColor } from '$lib/grades'

  type RouteWithAscents = InferResultType<'routes', { ascents: true }>

  interface Props {
    route: (Omit<RouteWithAscents, 'ascents'> & Partial<Pick<RouteWithAscents, 'ascents'>>) | undefined
  }

  let { route }: Props = $props()

  const send = $derived(route?.ascents?.find((ascent) => ascent.type === 'send'))

  const routeGradeConfig = $derived(
    $page.data.grades.find((grade) => (route == null ? false : grade.id === route?.gradeFk)),
  )
  const ascentGradeConfig = $derived(
    $page.data.grades.find((grade) => (route == null || route.ascents == null ? false : grade.id === send?.gradeFk)),
  )
  const gradeConfig = $derived(ascentGradeConfig ?? routeGradeConfig)
</script>

{#if route?.gradeFk != null}
  <span class="badge text-white" style={gradeConfig == null ? undefined : `background: ${getGradeColor(gradeConfig)}`}>
    {#if send?.gradeFk == null || send.gradeFk === route.gradeFk}
      {routeGradeConfig?.[$page.data.gradingScale]}
    {:else}
      <s>
        {routeGradeConfig?.[$page.data.gradingScale]}
      </s>

      &nbsp;

      {ascentGradeConfig?.[$page.data.gradingScale]}
    {/if}
  </span>
{/if}
