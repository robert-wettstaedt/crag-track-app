<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedRoute } from '$lib/db/utils'
  import { grades } from '$lib/grades'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: InferResultType<'ascents', { author: true; route: true }>[]

  $: body = ascents.map((ascent) => {
    const { dateTime, route, type } = ascent

    const climber = `<a class="anchor" href="/users/${ascent.author.userName}">${ascent.author.userName}</a>`

    const formattedDateTime = DateTime.fromSQL(dateTime).toLocaleString(DateTime.DATE_FULL)

    const routeGrade = (() => {
      if (route.gradingScale == null || route.grade == null) {
        return ''
      }

      const grade = grades.find((grade) => grade[route.gradingScale] === route.grade)
      return `<span class="badge text-white" style="background: ${grade?.color}">${route.gradingScale} ${route.grade}</span>`
    })()

    const personalGrade = (() => {
      if (route.gradingScale == null || ascent.grade == null) {
        return ''
      }

      const grade = grades.find((grade) => grade[route.gradingScale] === ascent.grade)
      return `<span class="badge text-white" style="background: ${grade?.color}">${route.gradingScale} ${ascent.grade}</span>`
    })()

    const enrichedRoute = route as EnrichedRoute
    const routeName = `<a class="anchor" href="${enrichedRoute.pathname}">${route.name}</a>`

    const formattedType =
      type === 'flash'
        ? '<i class="fa-solid fa-bolt-lightning text-yellow-300 me-2"></i> Flash'
        : type === 'send'
          ? '<i class="fa-solid fa-circle text-red-500 me-2"></i> Send'
          : '<i class="fa-solid fa-person-falling text-blue-300 me-2"></i> Attempt'

    return [climber, formattedDateTime, routeName, routeGrade, personalGrade, formattedType]
  })
</script>

<Table
  source={{
    head: ['Climber', 'Date time', 'Route name', 'Route grade', 'Personal grade', 'Type'],
    body,
  }}
/>
