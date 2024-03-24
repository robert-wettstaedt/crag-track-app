<script lang="ts">
  import { page } from '$app/stores'
  import BoulderName from '$lib/components/BoulderName'
  import { AppBar, Tab, TabGroup, focusTrap } from '@skeletonlabs/skeleton'

  export let data

  let tabSet: 'boulders' | 'crags' | 'areas' | 'users' = 'boulders'
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
      value={$page.url.searchParams.get('q') ?? ''}
    />
  </label>
</form>

{#if data.searchResults != null}
  <div class="mt-8">
    <TabGroup>
      <Tab bind:group={tabSet} name="boulders" value="boulders">
        <svelte:fragment slot="lead"><i class="fa-solid fa-route" /></svelte:fragment>
        Boulders ({data.searchResults.boulders.length})
      </Tab>
      <Tab bind:group={tabSet} name="crags" value="crags">
        <svelte:fragment slot="lead"><i class="fa-solid fa-mountain" /></svelte:fragment>
        Crags ({data.searchResults.crags.length})
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
        {#if tabSet === 'boulders'}
          <ul class="list">
            {#each data.searchResults.boulders as boulder}
              <li class="px-4 py-2 hover:bg-primary-500/10 flex justify-between">
                <a class="text-primary-500" href={boulder.pathname}>
                  <BoulderName {boulder} />
                </a>

                <a class="text-primary-500" href={boulder.parentCrag.pathname}>
                  {boulder.parentCrag.name}
                </a>
              </li>
            {/each}
          </ul>
        {:else if tabSet === 'crags'}
          <nav class="list-nav">
            <ul>
              {#each data.searchResults.crags as crag}
                <li>
                  <a href={crag.pathname}>
                    {crag.name}
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
                <li>{user.firstName} {user.lastName} {user.email}</li>
              {/each}
            </ul>
          </nav>
        {/if}
      </svelte:fragment>
    </TabGroup>
  </div>
{/if}
