<script lang="ts">
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, Tabs } from '@skeletonlabs/skeleton-svelte'
  import type { Snapshot } from './$types'
  import { onMount } from 'svelte'

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
  <div class="mt-8">
    <Tabs bind:value={tabSet}>
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
          <ul>
            {#each data.searchResults.routes as route}
              <li class="hover:preset-tonal-primary flex justify-between">
                <a class="anchor px-4 py-3 grow hover:text-white" href={route.pathname}>
                  <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} {route} />
                </a>

                <a class="anchor px-4 py-3 hover:text-white" href={route.block.pathname}>
                  {route.block.name}
                </a>
              </li>
            {/each}
          </ul>
        </Tabs.Panel>

        <Tabs.Panel value="blocks">
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.blocks as block}
                <li>
                  <a class="anchor px-4 py-3 flex hover:preset-tonal-primary hover:text-white" href={block.pathname}>
                    {block.name}
                  </a>
                </li>
              {/each}
            </ul>
          </nav>
        </Tabs.Panel>

        <Tabs.Panel value="areas">
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.areas as area}
                <li>
                  <a class="anchor px-4 py-3 flex hover:preset-tonal-primary hover:text-white" href={area.pathname}>
                    {area.name}
                  </a>
                </li>
              {/each}
            </ul>
          </nav>
        </Tabs.Panel>

        <Tabs.Panel value="users">
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.users as user}
                <li>
                  <a
                    class="anchor px-4 py-3 flex hover:preset-tonal-primary hover:text-white"
                    href={`/users/${user.userName}`}
                  >
                    {user.userName}
                  </a>
                </li>
              {/each}
            </ul>
          </nav>
        </Tabs.Panel>
      {/snippet}
    </Tabs>
  </div>
{/if}
