<script lang="ts">
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import AppBar from '$lib/components/AppBar'
  import AscentsTable from '$lib/components/AscentsTable'
  import type { PaginatedAscents } from '$lib/components/AscentsTable/load.server'
  import GenericList from '$lib/components/GenericList'
  import GradeHistogram from '$lib/components/GradeHistogram'
  import RouteName from '$lib/components/RouteName'
  import { ProgressRing, Tabs } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'
  import { onMount } from 'svelte'

  let { data, form } = $props()

  let loadedData: PaginatedAscents | null = $state(null)
  let loadError: string | null = $state(null)
  let loadOpts: Record<string, string> = $state({})

  let tabSet: 'sends' | 'open-projects' | 'finished-projects' | 'settings' = $state('sends')

  const sends = data.ascents
    .filter((ascent) => ascent.type !== 'attempt' && ascent.type !== 'repeat')
    .map((ascent) => {
      const grade = data.grades.find((grade) => grade.id === (ascent.gradeFk ?? ascent.route.gradeFk))

      if (grade == null) {
        return { ...ascent, grade: undefined }
      }

      return { ...ascent, grade: grade[data.gradingScale] }
    })

  const loadData = async () => {
    const searchParams = new URLSearchParams(loadOpts)
    const res = await fetch(`/api/users/${$page.params.name}/ascents?${searchParams.toString()}`)

    if (res.status != 200) {
      loadError = 'Unable to load ascents'
      return
    }

    const data = await res.json()
    loadedData = data
  }

  onMount(() => {
    loadData()
  })
</script>

<svelte:head>
  <title>Profile of {data.requestedUser.username} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    {data.requestedUser.username}
  {/snippet}
</AppBar>

<div class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900">
  <Tabs bind:value={tabSet} listClasses="overflow-x-auto overflow-y-hidden">
    {#snippet list()}
      <Tabs.Control value="sends">Ascents</Tabs.Control>

      <Tabs.Control value="open-projects">Open projects</Tabs.Control>
      <Tabs.Control value="finished-projects">Finished projects</Tabs.Control>

      {#if $page.data.session?.user?.id === data.requestedUser.authUserFk}
        <Tabs.Control value="settings">Settings</Tabs.Control>
      {/if}
    {/snippet}

    {#snippet content()}
      <Tabs.Panel value="sends">
        <GradeHistogram
          data={sends}
          spec={{
            width: 'container' as any,
            mark: {
              type: 'bar',
              stroke: 'white',
              cursor: 'pointer',
            },
            params: [
              {
                name: 'highlight',
                select: { type: 'point', on: 'pointerover' },
              },
              { name: 'select', select: 'point' },
            ],
            encoding: {
              fillOpacity: {
                condition: { param: 'select', value: 1 },
                value: 0.3,
              },
              strokeWidth: {
                condition: [
                  {
                    param: 'select',
                    empty: false,
                    value: 2,
                  },
                  {
                    param: 'highlight',
                    empty: false,
                    value: 1,
                  },
                ],
                value: 0,
              },
            },
          }}
          onEmbed={(result) => {
            result.view.addSignalListener('chartClick', (_, datum) => {
              const grade = data.grades.find((grade) => grade.FB === datum?.grade || grade.V === datum?.grade)

              loadOpts = grade == null ? {} : { grade: String(grade.id) }
              loadData()
            })
          }}
          opts={{
            patch: (spec) => {
              spec.signals?.push({
                name: 'chartClick',
                value: 0,
                on: [{ events: '*:mousedown', update: 'datum' }],
              })

              return spec
            },
          }}
        />

        {#if loadError != null}
          <aside class="card preset-tonal-warning mt-8 p-2 md:p-4 whitespace-pre-line">
            <p>{loadError}</p>
          </aside>
        {:else if loadedData == null}
          <div class="flex justify-center mt-16">
            <ProgressRing value={null} />
          </div>
        {:else}
          <AscentsTable
            ascents={loadedData.ascents}
            pagination={loadedData.pagination}
            paginationProps={{
              onPageChange: (detail) => {
                loadOpts = { ...loadOpts, page: String(detail.page) }
                loadData()
              },
            }}
          />
        {/if}
      </Tabs.Panel>

      <Tabs.Panel value="open-projects">
        <GenericList
          items={data.openProjects.map((item) => ({
            ...item,
            id: item.route.id,
            name: item.route.name,
            pathname: item.route.pathname,
          }))}
          leftClasses=""
        >
          {#snippet left(item)}
            <dt>
              <RouteName route={item.route} />
            </dt>

            <dd class="text-sm opacity-50">Sessions: {item.ascents.length}</dd>
            <dd class="text-sm opacity-50">
              Last session: {DateTime.fromSQL(item.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
            </dd>
          {/snippet}

          {#snippet right(item)}
            <ol class="flex items-center gap-2 w-auto p-2">
              <li>
                <a class="anchor" href={item.route.block.area.pathname}>
                  {item.route.block.area.name}
                </a>
              </li>

              <li class="opacity-50" aria-hidden={true}>&rsaquo;</li>

              <li>
                <a class="anchor" href={item.route.block.pathname}>
                  {item.route.block.name}
                </a>
              </li>
            </ol>
          {/snippet}
        </GenericList>
      </Tabs.Panel>

      <Tabs.Panel value="finished-projects">
        <GenericList
          items={data.finishedProjects.map((item) => ({
            ...item,
            id: item.route.id,
            name: item.route.name,
            pathname: item.route.pathname,
          }))}
          leftClasses=""
        >
          {#snippet left(item)}
            <dt>
              <RouteName route={item.route} />
            </dt>

            <dd class="text-sm opacity-50">Sessions: {item.ascents.length}</dd>
            <dd class="text-sm opacity-50">
              Last session: {DateTime.fromSQL(item.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
            </dd>
          {/snippet}

          {#snippet right(item)}
            <ol class="flex items-center gap-2 w-auto p-2">
              <li>
                <a class="anchor" href={item.route.block.area.pathname}>
                  {item.route.block.area.name}
                </a>
              </li>

              <li class="opacity-50" aria-hidden={true}>&rsaquo;</li>

              <li>
                <a class="anchor" href={item.route.block.pathname}>
                  {item.route.block.name}
                </a>
              </li>
            </ol>
          {/snippet}
        </GenericList>
      </Tabs.Panel>

      {#if $page.data.session?.user?.id === data.requestedUser.authUserFk}
        <Tabs.Panel value="settings">
          <form method="POST">
            {#if form?.error}
              <aside class="alert variant-filled-error mt-8">
                <div class="alert-message">
                  <p>{form.error}</p>
                </div>
              </aside>
            {/if}

            <label class="label mt-4">
              <span class="flex items-center gap-x-2">
                <img class="h-4 w-4" src={Logo8a} alt="8a" width={16} height={16} />
                Cookie
              </span>
              <input
                class="input"
                name="cookie8a"
                type="text"
                placeholder="Enter value..."
                value={form?.cookie8a ?? data.externalResources?.cookie8a ?? ''}
              />
            </label>

            <label class="label mt-4">
              <span class="flex items-center gap-x-2">
                <img class="h-4 w-4" src={Logo27crags} alt="27crags" width={16} height={16} />
                Cookie
              </span>
              <input
                class="input"
                name="cookie27crags"
                type="text"
                placeholder="Enter value..."
                value={form?.cookie27crags ?? data.externalResources?.cookie27crags ?? ''}
              />
            </label>

            <label class="label mt-4">
              <span class="flex items-center gap-x-2">
                <img class="h-4 w-4" src={LogoTheCrag} alt="TheCrag" width={16} height={16} />
                Cookie
              </span>
              <input
                class="input"
                name="cookieTheCrag"
                type="text"
                placeholder="Enter value..."
                value={form?.cookieTheCrag ?? data.externalResources?.cookieTheCrag ?? ''}
              />
            </label>

            <div class="flex justify-end mt-8">
              <button class="btn preset-filled-primary-500" type="submit">
                <i class="fa-solid fa-floppy-disk"></i>
                Save settings
              </button>
            </div>
          </form>
        </Tabs.Panel>
      {/if}
    {/snippet}
  </Tabs>
</div>
