<script lang="ts">
  import AscentTypeLabel from '$lib/components/AscentTypeLabel'
  import RouteGrade from '$lib/components/RouteGrade'
  import type { Grade, Route, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { Ratings } from '@skeletonlabs/skeleton'

  type RouteWithAscents = InferResultType<'routes', { ascents: true }>

  export let route: (Omit<RouteWithAscents, 'ascents'> & Partial<Pick<RouteWithAscents, 'ascents'>>) | undefined
  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] | undefined

  const lastAscent = route?.ascents?.toSorted((a, b) => a.dateTime.localeCompare(b.dateTime)).at(-1)
</script>

{#if route != null}
  <div class="flex gap-x-2 items-center">
    {#if lastAscent != null}
      <AscentTypeLabel includeText={false} type={lastAscent.type} />
    {/if}

    {#if route.gradeFk != null}
      <RouteGrade {route} {grades} {gradingScale} />
    {/if}

    {#if route.rating != null}
      <div>
        <Ratings justify="start" max={3} spacing="" value={route.rating}>
          <svelte:fragment slot="full"><i class="fa-solid fa-star text-warning-500" /></svelte:fragment>
        </Ratings>
      </div>
    {/if}

    {route.name.length === 0 ? '<no name>' : route.name}
  </div>
{/if}
