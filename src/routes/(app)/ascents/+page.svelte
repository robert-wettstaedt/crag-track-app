<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import AscentsTable from '$lib/components/AscentsTable'
  import { Pagination } from '@skeletonlabs/skeleton-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Ascents - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Ascents
  {/snippet}
</AppBar>

<div class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900">
  <AscentsTable ascents={data.ascents} grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} />
</div>

<div class="mt-8 flex justify-end">
  <Pagination
    data={[]}
    count={data.pagination.total}
    pageSize={data.pagination.pageSize}
    page={data.pagination.page}
    onPageChange={(detail) => {
      const url = new URL($page.url)
      url.searchParams.set('page', String(detail.page))
      goto(url)
    }}
  />
</div>
