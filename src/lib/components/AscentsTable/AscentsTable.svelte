<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import { grades } from '$lib/grades'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: InferResultType<'ascents', { author: true; parentBoulder: true }>[]

  $: body = ascents.map((ascent) => {
    const { dateTime, parentBoulder, type } = ascent
    const name = ascent.author.userName

    const formattedDateTime = DateTime.fromSQL(dateTime).toLocaleString(DateTime.DATE_FULL)

    const boulderGrade = (() => {
      if (parentBoulder.gradingScale == null || parentBoulder.grade == null) {
        return ''
      }

      const grade = grades.find((grade) => grade[parentBoulder.gradingScale] === parentBoulder.grade)
      return `<span class="badge text-white" style="background: ${grade?.color}">${parentBoulder.gradingScale} ${parentBoulder.grade}</span>`
    })()

    const personalGrade = (() => {
      if (parentBoulder.gradingScale == null || ascent.grade == null) {
        return ''
      }

      const grade = grades.find((grade) => grade[parentBoulder.gradingScale] === ascent.grade)
      return `<span class="badge text-white" style="background: ${grade?.color}">${parentBoulder.gradingScale} ${ascent.grade}</span>`
    })()

    const boulderName = parentBoulder.name

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
