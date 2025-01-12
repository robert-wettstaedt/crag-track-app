<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import { fitHeightAction } from '$lib/actions/fit-height.svelte.js'
  import { EDIT_PERMISSION } from '$lib/auth'
  import AppBar from '$lib/components/AppBar'
  import References from '$lib/components/References'
  import RouteName from '$lib/components/RouteName'
  import TopoViewer, { highlightedRouteStore, selectedRouteStore } from '$lib/components/TopoViewer'
  import { Tabs } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'
  import { onMount } from 'svelte'

  let { data } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let highlightedRoutes: number[] = $state([])

  let tabValue: string | undefined = $state(undefined)
  afterNavigate(() => {
    tabValue = $page.url.hash.length > 0 ? $page.url.hash : '#topo'
  })
  onMount(() => {
    tabValue = $page.url.hash.length > 0 ? $page.url.hash : '#topo'
  })
  const onChangeTab: Parameters<typeof Tabs>[1]['onFocusChange'] = (event) => {
    goto($page.url.pathname + event.focusedValue, { replaceState: true })
  }
</script>

<svelte:head>
  <title>{data.block.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    {data.block.name}
  {/snippet}

  {#snippet actions()}
    <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/export`}>
      <i class="fa-solid fa-file-export"></i>Export block preview
    </a>

    {#if data.userPermissions?.includes(EDIT_PERMISSION)}
      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen"></i>Edit block
      </a>

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit-location`}>
        <i class="fa-solid fa-location-dot"></i>Edit geolocation
      </a>
    {/if}
  {/snippet}

  {#snippet headline()}
    <Tabs
      fluid
      listClasses="overflow-x-auto overflow-y-hidden"
      listGap="0"
      onFocusChange={onChangeTab}
      value={tabValue}
    >
      {#snippet list()}
        <Tabs.Control value="#topo">Topo</Tabs.Control>

        <Tabs.Control value="#location">Location</Tabs.Control>

        <Tabs.Control value="#details">Details</Tabs.Control>
      {/snippet}

      {#snippet content()}
        <Tabs.Panel value="#topo">
          <div class="card mt-4 preset-filled-surface-100-900">
            <div class="flex flex-wrap md:flex-nowrap gap-2">
              {#if data.topos.length > 0}
                <section class="w-full md:w-2/4 relative" use:fitHeightAction>
                  <TopoViewer topos={data.topos}>
                    {#snippet actions()}
                      {#if data.userPermissions?.includes(EDIT_PERMISSION)}
                        <a aria-label="Edit topo" class="btn-icon preset-filled" href={`${basePath}/draw-topo`}>
                          <i class="fa-solid fa-pen"></i>
                        </a>
                      {/if}
                    {/snippet}
                  </TopoViewer>
                </section>
              {:else if data.userPermissions?.includes(EDIT_PERMISSION)}
                <div class="flex w-full justify-center mt-4">
                  <a class="btn preset-filled-primary-500" href={`${basePath}/add-topo`}> Add topos </a>
                </div>
              {/if}

              <section class={`mt-4 md:mt-0 w-full ${data.topos.length === 0 ? '' : 'md:w-2/4'}`}>
                {#if data.userPermissions?.includes(EDIT_PERMISSION)}
                  <div class="flex justify-center mb-4">
                    <a class="btn preset-filled-primary-500" href={`${basePath}/routes/add`}>Add route</a>
                  </div>
                {/if}

                {#if data.block.routes.length === 0}
                  No routes yet
                {:else}
                  <nav class="list-nav">
                    <ul>
                      {#each data.block.routes as route}
                        <li
                          class={`py-2 whitespace-nowrap ${
                            [$selectedRouteStore, $highlightedRouteStore, ...highlightedRoutes].includes(route.id)
                              ? 'preset-filled-primary-100-900'
                              : ''
                          }`}
                        >
                          <a
                            class={[$selectedRouteStore, $highlightedRouteStore, ...highlightedRoutes].includes(
                              route.id,
                            )
                              ? 'text-white'
                              : 'text-primary-500'}
                            href={`${basePath}/routes/${route.slug.length === 0 ? route.id : route.slug}`}
                            onmouseenter={() => highlightedRouteStore.set(route.id)}
                            onmouseleave={() => highlightedRouteStore.set(null)}
                            onclick={() => selectedRouteStore.set(route.id)}
                            onkeydown={(event) => event.key === 'Enter' && selectedRouteStore.set(route.id)}
                          >
                            <RouteName {route} />
                          </a>
                        </li>
                      {/each}
                    </ul>
                  </nav>
                {/if}
              </section>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="#details">
          <dl>
            <div class="flex p-2">
              <span class="flex-auto">
                <dt>Created at</dt>
                <dd>{DateTime.fromSQL(data.block.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
              </span>
            </div>

            <div class="flex p-2">
              <span class="flex-auto">
                <dt>Author</dt>
                <dd>
                  <a class="anchor" href="/users/{data.block.author.username}">
                    {data.block.author.username}
                  </a>
                </dd>
              </span>
            </div>

            {#await data.references then references}
              {#if references.routes.length > 0}
                <div class="flex p-2">
                  <span class="flex-auto">
                    <dt>Mentioned in</dt>

                    <dd class="flex gap-1 mt-1">
                      <References {references} />
                    </dd>
                  </span>
                </div>
              {/if}
            {/await}
          </dl>
        </Tabs.Panel>

        <Tabs.Panel value="#location">
          <div use:fitHeightAction>
            {#await import('$lib/components/BlocksMap') then BlocksMap}
              {#key data.block.id}
                <BlocksMap.default blocks={data.blocks} selectedBlock={data.block} />
              {/key}
            {/await}
          </div>
        </Tabs.Panel>
      {/snippet}
    </Tabs>
  {/snippet}
</AppBar>
