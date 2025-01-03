<script lang="ts">
  import AscentTypeLabel from '$lib/components/AscentTypeLabel'
  import RouteGrade from '$lib/components/RouteGrade'
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { Rating } from '@skeletonlabs/skeleton-svelte'

  type RouteWithAscents = InferResultType<'routes', { ascents: true }>

  interface Props {
    classes?: string
    route: (Omit<RouteWithAscents, 'ascents'> & Partial<Pick<RouteWithAscents, 'ascents'>>) | undefined
    grades: Grade[]
    gradingScale: UserSettings['gradingScale'] | undefined
  }

  let { classes, route, grades, gradingScale }: Props = $props()

  const lastAscent = $derived(route?.ascents?.toSorted((a, b) => a.dateTime.localeCompare(b.dateTime)).at(-1))
</script>

{#if route != null}
  <div class="flex gap-x-2 items-center {classes}">
    {#if lastAscent != null}
      <AscentTypeLabel includeText={false} type={lastAscent.type} />
    {/if}

    {#if route.gradeFk != null}
      <RouteGrade {route} {grades} {gradingScale} />
    {/if}

    {#if route.rating != null}
      <div>
        <Rating count={3} readOnly value={route.rating}>
          {#snippet iconFull()}
            <i class="fa-solid fa-star text-warning-500"></i>
          {/snippet}
        </Rating>
      </div>
    {/if}

    <div class="overflow-hidden text-ellipsis">
      {route.name.length === 0 ? '<no name>' : route.name}
    </div>
  </div>
{/if}
