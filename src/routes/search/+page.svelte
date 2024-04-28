<script lang="ts">
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, Tab, TabGroup, focusTrap } from '@skeletonlabs/skeleton'
  import type { Snapshot } from './$types.js'

  export let data

  export const snapshot: Snapshot = {
    capture: () => {
      console.log('snapshot capture', searchQuery)
      return searchQuery
    },
    restore: (value) => {
      console.log('snapshot restore', value)

      searchQuery = value
    },
  }

  let searchQuery = $page.url.searchParams.get('q') ?? ''
  let tabSet: 'routes' | 'blocks' | 'areas' | 'users' = 'routes'
  let element: HTMLFormElement | null = null

  const formAction = (el: HTMLFormElement) => {
    element = el
  }
</script>

<AppBar>
  <svelte:fragment slot="lead">Search</svelte:fragment>
</AppBar>

<form class="mt-8" use:focusTrap={true} use:formAction>
  <label class="label">
    <input
      class="input"
      name="q"
      on:keypress={(event) => event.key === 'Enter' && element?.submit()}
      placeholder="Search..."
      type="search"
      bind:value={searchQuery}
    />
  </label>
</form>

{#if data.searchResults != null}
  <div class="mt-8">
    <TabGroup>
      <Tab bind:group={tabSet} name="routes" value="routes">
        <svelte:fragment slot="lead"><i class="fa-solid fa-route" /></svelte:fragment>
        Routes ({data.searchResults.routes.length})
      </Tab>
      <Tab bind:group={tabSet} name="blocks" value="blocks">
        <svelte:fragment slot="lead"><i class="fa-solid fa-mountain" /></svelte:fragment>
        Blocks ({data.searchResults.blocks.length})
      </Tab>
      <Tab bind:group={tabSet} name="areas" value="areas">
        <svelte:fragment slot="lead"><i class="fa-solid fa-layer-group" /></svelte:fragment>
        Areas ({data.searchResults.areas.length})
      </Tab>
      <Tab bind:group={tabSet} name="users" value="users">
        <svelte:fragment slot="lead"><i class="fa-solid fa-user" /></svelte:fragment>
        Users ({data.searchResults.users.length})
      </Tab>

      <svelte:fragment slot="panel">
        {#if tabSet === 'routes'}
          <ul class="list">
            {#each data.searchResults.routes as route}
              <li class="px-4 py-2 hover:bg-primary-500/10 flex justify-between">
                <a class="text-primary-500" href={route.pathname}>
                  <RouteName {route} />
                </a>

                <a class="text-primary-500" href={route.block.pathname}>
                  {route.block.name}
                </a>
              </li>
            {/each}
          </ul>
        {:else if tabSet === 'blocks'}
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.blocks as block}
                <li>
                  <a href={block.pathname}>
                    {block.name}
                  </a>
                </li>
              {/each}
            </ul>
          </nav>
        {:else if tabSet === 'areas'}
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.areas as area}
                <li>
                  <a href={area.pathname}>
                    {area.name}
                  </a>
                </li>
              {/each}
            </ul>
          </nav>
        {:else if tabSet === 'users'}
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.users as user}
                <li>
                  <a href={`/users/${user.userName}`}>
                    {user.userName}
                  </a>
                </li>
              {/each}
            </ul>
          </nav>
        {/if}
      </svelte:fragment>
    </TabGroup>
  </div>
{/if}
