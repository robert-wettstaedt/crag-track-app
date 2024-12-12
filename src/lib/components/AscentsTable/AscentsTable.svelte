<script lang="ts">
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { DateTime } from 'luxon'
  import AscentTypeLabel from '../AscentTypeLabel'
  import RouteName from '../RouteName'

  interface Props {
    ascents: InferResultType<'ascents', { author: true; route: true }>[]
    grades: Grade[]
    gradingScale?: UserSettings['gradingScale']
  }

  let { ascents, grades, gradingScale = 'FB' }: Props = $props()
</script>

<div class="table-wrap">
  {#if ascents.length === 0}
    No ascents yet
  {:else}
    <table class="table">
      <thead>
        <tr>
          <th>Climber</th>
          <th>Date time</th>
          <th>Type</th>
          <th>Route</th>
        </tr>
      </thead>

      <tbody class="hover:[&>tr]:preset-tonal-primary">
        {#each ascents as ascent}
          <tr class="whitespace-nowrap">
            <td>
              <a class="anchor hover:text-white" href="/users/{ascent.author.username}">{ascent.author.username}</a>
            </td>

            <td>
              {DateTime.fromSQL(ascent.dateTime).toLocaleString(DateTime.DATE_FULL)}
            </td>

            <td>
              <AscentTypeLabel includeText type={ascent.type} />
            </td>

            <td>
              <a class="anchor hover:text-white" href={ascent.route.pathname}>
                <RouteName {grades} route={ascent.route} {gradingScale} />
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
