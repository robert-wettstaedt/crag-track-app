<script lang="ts">
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import AppBar from '$lib/components/AppBar'
  import GenericList from '$lib/components/GenericList'
  import RouteName from '$lib/components/RouteName'
  import Vega from '$lib/components/Vega'
  import type { UserSettings } from '$lib/db/schema.js'
  import { getGradeColor } from '$lib/grades'
  import { Tabs } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'

  let { data, form } = $props()

  let tabSet: 'sends' | 'open-projects' | 'finished-projects' | 'settings' = $state('sends')

  const gradingScale: UserSettings['gradingScale'] = data.user?.userSettings?.gradingScale ?? 'FB'

  const ascents = data.sends.map((ascent) => {
    const grade = data.grades.find((grade) => grade.id === (ascent.gradeFk ?? ascent.route.gradeFk))

    if (grade == null) {
      return ascent
    }

    return { ...ascent, grade: grade[gradingScale], color: getGradeColor(grade) }
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
      <Tabs.Control value="sends">Sends</Tabs.Control>

      <Tabs.Control value="open-projects">Open projects</Tabs.Control>
      <Tabs.Control value="finished-projects">Finished projects</Tabs.Control>

      {#if $page.data.session?.user?.id === data.requestedUser.authUserFk}
        <Tabs.Control value="settings">Settings</Tabs.Control>
      {/if}
    {/snippet}

    {#snippet content()}
      <Tabs.Panel value="sends">
        <Vega
          spec={{
            background: 'transparent',
            width: 'container',
            data: {
              values: ascents,
            },
            mark: 'bar',
            encoding: {
              color: {
                legend: null,
                field: 'grade',
                scale: {
                  domain: data.grades.map((grade) => grade[gradingScale]),
                  range: data.grades.map((grade) => getGradeColor(grade)),
                },
              },
              x: {
                field: 'grade',
                scale: {
                  domain: data.grades.map((grade) => grade[gradingScale]),
                },
                type: 'nominal',
                title: 'Grade',
              },
              y: {
                aggregate: 'count',
                field: 'grade',
                title: 'Count',
              },
              tooltip: [
                {
                  field: 'grade',
                  type: 'nominal',
                  title: 'Grade',
                },
                {
                  aggregate: 'count',
                  field: 'grade',
                  title: 'Count',
                },
              ],
            },
          }}
          opts={{
            actions: false,
            renderer: 'svg',
            theme: 'dark',
          }}
        />
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
              <RouteName grades={data.grades} {gradingScale} route={item.route} />
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
              <RouteName grades={data.grades} {gradingScale} route={item.route} />
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
