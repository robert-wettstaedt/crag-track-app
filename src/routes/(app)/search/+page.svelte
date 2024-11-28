<script lang="ts">
  import { page } from '$app/stores'
  import GenericList from '$lib/components/GenericList'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, Tabs } from '@skeletonlabs/skeleton-svelte'
  import { onMount } from 'svelte'
  import type { Snapshot } from './$types'

  let { data } = $props()

  export const snapshot: Snapshot = {
    capture: () => searchQuery,
    restore: (value) => {
      searchQuery = value
    },
  }

  let searchQuery = $state($page.url.searchParams.get('q') ?? '')
  let tabSet: 'routes' | 'blocks' | 'areas' | 'users' = $state('routes')
  let element: HTMLInputElement | null = $state(null)

  onMount(() => {
    element?.focus()
  })
</script>

<svelte:head>
  <title>Search - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Search
  {/snippet}
</AppBar>

<form class="mt-8">
  <label class="label">
    <input
      bind:this={element}
      bind:value={searchQuery}
      class="input"
      name="q"
      onkeypress={(event) => event.key === 'Enter' && (element as HTMLFormElement | null)?.submit?.()}
      placeholder="Search..."
      type="search"
    />
  </label>
</form>

{#if data.searchResults != null}
  <div class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900">
    <Tabs bind:value={tabSet} listClasses="overflow-x-auto overflow-y-hidden">
      {#snippet list()}
        <Tabs.Control value="routes">
          {#snippet lead()}
            <i class="fa-solid fa-route"></i>
          {/snippet}
          Routes ({data.searchResults.routes.length})
        </Tabs.Control>

        <Tabs.Control value="blocks">
          {#snippet lead()}
            <i class="fa-solid fa-mountain"></i>
          {/snippet}
          Blocks ({data.searchResults.blocks.length})
        </Tabs.Control>

        <Tabs.Control value="areas">
          {#snippet lead()}
            <i class="fa-solid fa-layer-group"></i>
          {/snippet}
          Areas ({data.searchResults.areas.length})
        </Tabs.Control>

        <Tabs.Control value="users">
          {#snippet lead()}
            <i class="fa-solid fa-user"></i>
          {/snippet}
          Users ({data.searchResults.users.length})
        </Tabs.Control>
      {/snippet}

      {#snippet content()}
        <Tabs.Panel value="routes">
          <GenericList
            items={data.searchResults.routes}
            rightContent={(item) => item.block.name}
            rightPathname={(item) => item.block.pathname}
          >
            {#snippet left(item)}
              <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={item} />
            {/snippet}
          </GenericList>
        </Tabs.Panel>

        <Tabs.Panel value="blocks">
          <GenericList items={data.searchResults.blocks}>
            {#snippet left(item)}
              {item.name}
            {/snippet}
          </GenericList>
        </Tabs.Panel>

        <Tabs.Panel value="areas">
          <GenericList items={data.searchResults.areas}>
            {#snippet left(item)}
              {item.name}
            {/snippet}
          </GenericList>
        </Tabs.Panel>

        <Tabs.Panel value="users">
          <GenericList
            items={data.searchResults.users.map((user) => ({
              ...user,
              name: user.userName,
              pathname: `/users/${user.userName}`,
            }))}
          >
            {#snippet left(item)}
              {item.name}
            {/snippet}
          </GenericList>
        </Tabs.Panel>
      {/snippet}
    </Tabs>
  </div>
{/if}
