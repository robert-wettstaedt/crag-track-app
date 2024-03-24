<script lang="ts">
  import type { Ascent, Boulder } from '$lib/db/schema'
  import { Table } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let ascents: Array<{ ascent: Ascent; boulder: Boulder }>

  $: body = ascents.map((item) => {
    const { dateTime, id, type } = item.ascent

    const formattedDateTime = DateTime.fromSQL(dateTime).toLocaleString(DateTime.DATE_FULL)
    const boulderName = item.boulder.name
    const boulderGrade =
      item.boulder.gradingScale == null || item.boulder.grade == null
        ? ''
        : `${item.boulder.gradingScale} ${item.boulder.grade}`
    const personalGrade =
      item.boulder.gradingScale == null || item.ascent.grade == null
        ? ''
        : `${item.boulder.gradingScale} ${item.ascent.grade}`

    const formattedType =
      type === 'flash'
        ? '<i class="fa-solid fa-bolt-lightning text-yellow-300 me-2"></i> Flash'
        : type === 'send'
          ? '<i class="fa-solid fa-circle text-red-500 me-2"></i> Send'
          : '<i class="fa-solid fa-person-falling text-blue-300 me-2"></i> Attempt'

    return [String(id), formattedDateTime, boulderName, boulderGrade, personalGrade, formattedType]
  })
</script>

<!-- on:selected={(event) => goto(`/ascents/${event.detail[0]}`)} -->
<Table
  interactive
  source={{
    head: ['ID', 'Date time', 'Boulder name', 'Boulder grade', 'Personal grade', 'Type'],
    body,
  }}
/>
