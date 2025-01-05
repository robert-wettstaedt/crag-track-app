<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import AscentsTable from '$lib/components/AscentsTable'

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

<AscentsTable
  ascents={data.ascents}
  pagination={data.pagination}
  paginationProps={{
    onPageChange: (detail) => {
      const url = new URL($page.url)
      url.searchParams.set('page', String(detail.page))
      goto(url)
    },
  }}
/>
