<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: InferResultType<'ascents', { author: true; parentBoulder: true }>[]

  $: body = ascents.map((ascent) => {
    const { dateTime, parentBoulder, type } = ascent
    const name = `${ascent.author.firstName} ${ascent.author.lastName}`

    const formattedDateTime = DateTime.fromSQL(dateTime).toLocaleString(DateTime.DATE_FULL)
    const boulderName = parentBoulder.name
    const boulderGrade =
      parentBoulder.gradingScale == null || parentBoulder.grade == null
        ? ''
        : `${parentBoulder.gradingScale} ${parentBoulder.grade}`
    const personalGrade =
      parentBoulder.gradingScale == null || ascent.grade == null ? '' : `${parentBoulder.gradingScale} ${ascent.grade}`

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
