<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedBoulder } from '$lib/db/utils'
  import { grades } from '$lib/grades'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: InferResultType<'ascents', { author: true; boulder: true }>[]

  $: body = ascents.map((ascent) => {
    const { dateTime, boulder, type } = ascent

    const climber = `<a class="anchor" href="/users/${ascent.author.userName}">${ascent.author.userName}</a>`

    const formattedDateTime = DateTime.fromSQL(dateTime).toLocaleString(DateTime.DATE_FULL)

    const boulderGrade = (() => {
      if (boulder.gradingScale == null || boulder.grade == null) {
        return ''
      }

      const grade = grades.find((grade) => grade[boulder.gradingScale] === boulder.grade)
      return `<span class="badge text-white" style="background: ${grade?.color}">${boulder.gradingScale} ${boulder.grade}</span>`
    })()

    const personalGrade = (() => {
      if (boulder.gradingScale == null || ascent.grade == null) {
        return ''
      }

      const grade = grades.find((grade) => grade[boulder.gradingScale] === ascent.grade)
      return `<span class="badge text-white" style="background: ${grade?.color}">${boulder.gradingScale} ${ascent.grade}</span>`
    })()

    const enrichedBoulder = boulder as EnrichedBoulder
    const boulderName = `<a class="anchor" href="${enrichedBoulder.pathname}">${boulder.name}</a>`

    const formattedType =
      type === 'flash'
        ? '<i class="fa-solid fa-bolt-lightning text-yellow-300 me-2"></i> Flash'
        : type === 'send'
          ? '<i class="fa-solid fa-circle text-red-500 me-2"></i> Send'
          : '<i class="fa-solid fa-person-falling text-blue-300 me-2"></i> Attempt'

    return [climber, formattedDateTime, boulderName, boulderGrade, personalGrade, formattedType]
  })
</script>

<Table
  source={{
    head: ['Climber', 'Date time', 'Boulder name', 'Boulder grade', 'Personal grade', 'Type'],
    body,
  }}
/>
