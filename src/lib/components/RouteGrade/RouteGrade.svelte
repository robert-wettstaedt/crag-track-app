<script lang="ts">
  import { page } from '$app/stores'
  import type { InferResultType } from '$lib/db/types'
  import CorrectedGrade from './components/CorrectedGrade'

  type RouteWithAscents = InferResultType<'routes', { ascents: true }>

  interface Props {
    route: Partial<Pick<RouteWithAscents, 'ascents' | 'gradeFk'>> | undefined
  }

  let { route }: Props = $props()

  const send = $derived(route?.ascents?.find((ascent) => ascent.type === 'send'))

  const routeGradeConfig = $derived(
    $page.data.grades.find((grade) => (route == null ? false : grade.id === route?.gradeFk)),
  )
  const ascentGradeConfig = $derived(
    $page.data.grades.find((grade) => (route == null || route.ascents == null ? false : grade.id === send?.gradeFk)),
  )
</script>

<CorrectedGrade oldGrade={route?.gradeFk} newGrade={send?.gradeFk} />
