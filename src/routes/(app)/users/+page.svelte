<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import GenericList from '$lib/components/GenericList'
  import { Pagination } from '@skeletonlabs/skeleton-svelte'

  const { data } = $props()
</script>

<svelte:head>
  <title>Users - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Users
  {/snippet}
</AppBar>

<div class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900">
  <div class="table-wrap">
    {#if data.users.length === 0}
      No users yet
    {:else}
      <GenericList
        items={data.users.map((item) => ({ ...item, name: item.username, pathname: `/users/${item.username}` }))}
      >
        {#snippet left(item)}
          {item.username}
        {/snippet}
      </GenericList>
    {/if}
  </div>
</div>

<div class="my-8 flex justify-end">
  <Pagination
    buttonClasses="btn-sm md:btn-md"
    count={data.pagination.total}
    data={[]}
    page={data.pagination.page}
    pageSize={data.pagination.pageSize}
    siblingCount={0}
    onPageChange={(detail) => {
      const url = new URL($page.url)
      url.searchParams.set('page', String(detail.page))
      goto(url)
    }}
  />
</div>
