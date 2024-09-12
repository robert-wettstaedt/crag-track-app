<script lang="ts">
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedRoute } from '$lib/db/utils'
  import { getGradeColor } from '$lib/grades'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: InferResultType<'ascents', { author: true; route: true }>[]
  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] = 'FB'

  $: body = ascents.map((ascent) => {
    const { dateTime, route, type } = ascent

    const climber = `<a class="anchor" href="/users/${ascent.author.userName}">${ascent.author.userName}</a>`

    const formattedDateTime = DateTime.fromSQL(dateTime).toLocaleString(DateTime.DATE_FULL)

    const routeGrade = (() => {
      const grade = grades.find((grade) => grade.id === route.gradeFk)

      if (grade == null) {
        return ''
      }

      return `<span class="badge text-white" style="background: ${getGradeColor(grade)}">${grade[gradingScale]}</span>`
    })()

    const personalGrade = (() => {
      const grade = grades.find((grade) => grade.id === ascent.gradeFk)

      if (grade == null) {
        return ''
      }

      return `<span class="badge text-white" style="background: ${getGradeColor(grade)}">${grade[gradingScale]}</span>`
    })()

    const enrichedRoute = route as EnrichedRoute
    const routeName = `<a class="anchor" href="${enrichedRoute.pathname}">${route.name.length === 0 ? '&lt;no name&gt;' : route.name}</a>`

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
