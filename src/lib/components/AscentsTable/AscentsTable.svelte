<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import { grades } from '$lib/grades'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: InferResultType<'ascents', { author: true; boulder: true }>[]

  $: body = ascents.map((ascent) => {
    const { dateTime, boulder, type } = ascent
    const name = ascent.author.userName

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

    const boulderName = boulder.name

    const formattedType =
      type === 'flash'
        ? '<i class="fa-solid fa-bolt-lightning text-yellow-300 me-2"></i> Flash'
        : type === 'send'
          ? '<i class="fa-solid fa-circle text-red-500 me-2"></i> Send'
          : '<i class="fa-solid fa-person-falling text-blue-300 me-2"></i> Attempt'

    return [name, formattedDateTime, boulderName, boulderGrade, personalGrade, formattedType]
  })
</script>

<!-- on:selected={(event) => goto(`/ascents/${event.detail[0]}`)} -->
<Table
  interactive
  source={{
    head: ['Climber', 'Date time', 'Boulder name', 'Boulder grade', 'Personal grade', 'Type'],
    body,
  }}
/>
