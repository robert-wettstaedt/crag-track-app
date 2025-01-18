<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type { Pagination } from '$lib/pagination.server'
  import type { ItemProps } from './components/Item'
  import Item from './components/Item'
  import type { ActivityDTO } from './index'

  interface Props extends Pick<ItemProps, 'withBreadcrumbs'> {
    activities: ActivityDTO[]
    pagination: Pagination
  }

  const { activities, pagination, ...rest }: Props = $props()

  let activityPages = $state<(typeof activities)[]>([])
  let prevPage = $state(1)
  let activityType = $state('all')

  afterNavigate(() => {
    if (pagination.page === prevPage + 1) {
      activityPages.push(activities)

      if (activityPages.length > 1) {
        requestAnimationFrame(() => {
          document.querySelector(`#feed-${activityPages.length}`)?.scrollIntoView({ behavior: 'smooth' })
        })
      }
    } else {
      activityPages = [activities]
    }

    prevPage = pagination.page
    activityType = $page.url.searchParams.get('type') ?? 'all'
  })
</script>

<label class="label flex flex-col sm:flex-row sm:items-center gap-2">
  <span class="label-text font-medium">Filter activity feed:</span>
  <select
    class="select select-bordered w-full sm:w-auto"
    onchange={(event) => {
      const url = new URL($page.url)

      const activityType = (event.target as HTMLSelectElement).value
      if (activityType === 'ascents') {
        url.searchParams.set('type', activityType)
      } else {
        url.searchParams.delete('type')
      }

      url.searchParams.delete('page')
      goto(url)
    }}
    value={activityType}
  >
    <option value="all">Show all activity</option>
    <option value="ascents">Show ascents only</option>
  </select>
</label>

{#each activityPages as activities, i}
  <div class="mt-8" id="feed-{i + 1}">
    {#if activities.length === 0}
      <p class="text-center opacity-75">No recent activity</p>
    {:else}
      <div class="space-y-8">
        {#each activities as activity}
          <Item {activity} {...rest} />
        {/each}
      </div>
    {/if}
  </div>
{/each}

<div class="flex justify-center my-16">
  <button
    class="btn preset-outlined-primary-500"
    disabled={pagination.page >= pagination.totalPages}
    onclick={() => {
      const nextPage = pagination.page + 1
      const url = new URL($page.url)
      url.searchParams.set('page', String(nextPage))
      goto(url)
    }}
  >
    Load more activities
  </button>
</div>
