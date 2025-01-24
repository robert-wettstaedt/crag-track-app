<script lang="ts">
  import { enhance } from '$app/forms'
  import { afterNavigate, goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import { fitHeightAction } from '$lib/actions/fit-height.svelte'
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import { EDIT_PERMISSION } from '$lib/auth'
  import ActivityFeed from '$lib/components/ActivityFeed'
  import AppBar from '$lib/components/AppBar'
  import FileViewer from '$lib/components/FileViewer'
  import References from '$lib/components/References'
  import RouteName from '$lib/components/RouteName'
  import TopoViewer, { highlightedRouteStore, selectedRouteStore } from '$lib/components/TopoViewer'
  import { ProgressRing, Tabs } from '@skeletonlabs/skeleton-svelte'
  import { onMount } from 'svelte'

  let { data } = $props()
  let basePath = $derived(
    `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`,
  )

  let files = $state(data.files)
  $effect(() => {
    files = data.files
  })

  let grade = $derived(data.grades.find((grade) => grade.id === data.route.gradeFk))

  let syncing = $state(false)

  let tabValue: string | undefined = $state(undefined)
  afterNavigate(() => {
    tabValue = $page.url.hash.length > 0 ? $page.url.hash : '#info'
    selectedRouteStore.set(data.route.id)
    highlightedRouteStore.set(null)
  })
  onMount(() => {
    tabValue = $page.url.hash.length > 0 ? $page.url.hash : '#info'
    selectedRouteStore.set(data.route.id)
    highlightedRouteStore.set(null)
  })
  const onChangeTab: Parameters<typeof Tabs>[1]['onFocusChange'] = (event) => {
    goto($page.url.pathname + event.focusedValue, { replaceState: true })
  }

  const hasActions = $derived(data.userPermissions?.includes(EDIT_PERMISSION) || data.route.externalResources != null)
</script>

<svelte:head>
  <title>
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.gradingScale]})`}
    - {PUBLIC_APPLICATION_NAME}
  </title>
</svelte:head>

<AppBar {hasActions}>
  {#snippet lead()}
    <RouteName classes="flex-wrap" route={data.route} />
  {/snippet}

  {#snippet actions()}
    {#if data.route.externalResources?.externalResource8a?.url != null}
      <a
        class="btn btn-sm preset-outlined-primary-500"
        href={data.route.externalResources.externalResource8a.url}
        target="_blank"
      >
        <img src={Logo8a} alt="8a" width={16} height={16} />

        <span class="md:hidden"> Show on 8a.nu </span>
      </a>
    {/if}

    {#if data.route.externalResources?.externalResource27crags?.url != null}
      <a
        class="btn btn-sm preset-outlined-primary-500"
        href={data.route.externalResources.externalResource27crags.url}
        target="_blank"
      >
        <img src={Logo27crags} alt="27crags" width={16} height={16} />

        <span class="md:hidden"> Show on 27crags </span>
      </a>
    {/if}

    {#if data.route.externalResources?.externalResourceTheCrag?.url != null}
      <a
        class="btn btn-sm preset-outlined-primary-500"
        href={data.route.externalResources.externalResourceTheCrag.url}
        target="_blank"
      >
        <img src={LogoTheCrag} alt="The Crag" width={16} height={16} />

        <span class="md:hidden"> Show on theCrag </span>
      </a>
    {/if}

    {#if data.userPermissions?.includes(EDIT_PERMISSION)}
      <form
        class="leading-none"
        method="POST"
        action="?/syncExternalResources"
        use:enhance={({}) => {
          syncing = true

          return ({ result }) => {
            syncing = false

            if (result.type === 'success') {
              invalidateAll()
            }
          }
        }}
      >
        <button class="btn btn-sm preset-filled-primary-500" disabled={syncing} type="submit">
          {#if syncing}
            <span class="me-2">
              <ProgressRing size="size-sm" value={null} />
            </span>
          {/if}

          Sync external resources
        </button>
      </form>

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/add-file`}>
        <i class="fa-solid fa-cloud-arrow-up"></i>Upload file
      </a>

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit-first-ascent`}>
        <i class="fa-solid fa-pen"></i>Edit FA
      </a>

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen"></i>Edit route
      </a>
    {/if}
  {/snippet}

  {#snippet headline()}
    <Tabs
      fluid
      listClasses="overflow-x-auto overflow-y-hidden pb-[1px] md:w-[500px]"
      listGap="0"
      onFocusChange={onChangeTab}
      value={tabValue}
    >
      {#snippet list()}
        <Tabs.Control value="#info">Info</Tabs.Control>

        {#if data.topos.length > 0}
          <Tabs.Control value="#topo">Topo</Tabs.Control>
        {/if}

        <Tabs.Control value="#activity">Activity</Tabs.Control>

        <Tabs.Control value="#map">Map</Tabs.Control>
      {/snippet}

      {#snippet content()}
        {#if data.topos.length > 0}
          <Tabs.Panel value="#topo">
            <div class="flex">
              <section class="w-full relative" use:fitHeightAction>
                <TopoViewer topos={data.topos} />
              </section>
            </div>
          </Tabs.Panel>
        {/if}

        <Tabs.Panel value="#activity">
          <section class="p-2">
            <div class="flex justify-center mb-4">
              <a class="btn preset-filled-primary-500" href={`${basePath}/ascents/add`}>Log ascent</a>
            </div>

            <ActivityFeed activities={data.feed.activities} pagination={data.feed.pagination} />
          </section>
        </Tabs.Panel>

        <Tabs.Panel value="#map">
          <div use:fitHeightAction>
            {#await import('$lib/components/BlocksMap') then BlocksMap}
              {#key data.block.id}
                <BlocksMap.default blocks={data.blocks} selectedBlock={data.block} />
              {/key}
            {/await}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="#info">
          <dl>
            <div class="flex p-2">
              <span class="flex-auto">
                <dt>FA</dt>
                <dd class="flex justify-between items-center">
                  <span>
                    {#if data.route.firstAscent == null}
                      unknown
                    {:else if data.route.firstAscent.climber != null}
                      <a class="anchor" href={`/users/${data.route.firstAscent.climber.username}`}>
                        {data.route.firstAscent.climber.username}
                      </a>

                      &nbsp;
                    {:else if data.route.firstAscent.climberName != null}
                      {data.route.firstAscent.climberName}

                      &nbsp;
                    {/if}

                    {data.route.firstAscent?.year ?? ''}
                  </span>
                </dd>
              </span>
            </div>

            {#if data.route.description != null && data.route.description.length > 0}
              <div class="flex p-2">
                <span class="flex-auto">
                  <dt>Description</dt>
                  <dd>
                    <div class="rendered-markdown">
                      {@html data.route.description}
                    </div>
                  </dd>
                </span>
              </div>
            {/if}

            {#if data.route.tags.length > 0}
              <div class="flex p-2">
                <span class="flex-auto">
                  <dt>Tags</dt>
                  <dd class="flex gap-1 mt-1">
                    {#each data.route.tags as tag}
                      <span class="chip preset-filled-surface-900-100">
                        <i class="fa-solid fa-tag me-2"></i>
                        {tag.tagFk}
                      </span>
                    {/each}
                  </dd>
                </span>
              </div>
            {/if}

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

            {#if files.length > 0}
              <div class="flex p-2">
                <span class="flex-auto">
                  <dt>Files</dt>
                  <dd class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {#each files as file}
                      {#if file.stat != null}
                        <FileViewer
                          {file}
                          readOnly={!data.userPermissions?.includes(EDIT_PERMISSION)}
                          stat={file.stat}
                          on:delete={() => {
                            files = files.filter((_file) => file.id !== _file.id)
                          }}
                        />
                      {:else if file.error != null}
                        <aside class="alert variant-filled-error">
                          <div class="alert-message">
                            <h3 class="h3">Error</h3>
                            <p>{file.error}</p>
                          </div>
                        </aside>
                      {/if}
                    {/each}
                  </dd>
                </span>
              </div>
            {/if}
          </dl>
        </Tabs.Panel>
      {/snippet}
    </Tabs>
  {/snippet}
</AppBar>
