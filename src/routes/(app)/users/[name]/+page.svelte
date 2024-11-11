<script lang="ts">
  import { page } from '$app/stores'
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import RouteName from '$lib/components/RouteName'
  import Vega from '$lib/components/Vega'
  import { getGradeColor } from '$lib/grades'
  import { AppBar, Tabs } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'

  let { data, form } = $props()

  let tabSet: 'sends' | 'open-projects' | 'finished-projects' | 'settings' = $state('sends')

  const gradingScale = data.user?.userSettings?.gradingScale ?? 'FB'

  const ascents = data.sends.map((ascent) => {
    const grade = data.grades.find((grade) => grade.id === (ascent.gradeFk ?? ascent.route.gradeFk))

    if (grade == null) {
      return ascent
    }

    return { ...ascent, grade: grade[gradingScale], color: getGradeColor(grade) }
  })
</script>

<svelte:head>
  <title>Profile of {data.user?.userName} - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    {data.user?.userName}
  {/snippet}
</AppBar>

<div class="card mt-8 p-4 preset-filled-surface-100-900">
  <Tabs bind:value={tabSet}>
    {#snippet list()}
      <Tabs.Control value="sends">Sends</Tabs.Control>

      <Tabs.Control value="open-projects">Open projects</Tabs.Control>
      <Tabs.Control value="finished-projects">Finished projects</Tabs.Control>

      {#if $page.data.session?.user?.email === data.user?.email}
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
        <nav class="list-nav">
          <ul>
            {#each data.openProjects as attempt}
              <li class="flex justify-between w-full p-3 hover:preset-tonal-primary">
                <a class="flex flex-col !items-start hover:!bg-transparent" href={attempt.route.pathname}>
                  <dt>
                    <RouteName grades={data.grades} {gradingScale} route={attempt.route} />
                  </dt>

                  <dd class="text-sm opacity-50">Sessions: {attempt.ascents.length}</dd>
                  <dd class="text-sm opacity-50">
                    Last session: {DateTime.fromSQL(attempt.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
                  </dd>
                </a>

                <ol class="flex items-center gap-2 w-auto pe-4">
                  <li>
                    <a class="anchor" href={attempt.route.block.area.pathname}>
                      {attempt.route.block.area.name}
                    </a>
                  </li>

                  <li class="opacity-50" aria-hidden={true}>&rsaquo;</li>

                  <li>
                    <a class="anchor" href={attempt.route.block.pathname}>
                      {attempt.route.block.name}
                    </a>
                  </li>
                </ol>
              </li>
            {/each}
          </ul>
        </nav>
      </Tabs.Panel>

      <Tabs.Panel value="finished-projects">
        <nav class="list-nav">
          <ul>
            {#each data.finishedProjects as attempt}
              <li class="flex justify-between w-full p-3 hover:preset-tonal-primary">
                <a class="flex flex-col !items-start hover:!bg-transparent" href={attempt.route.pathname}>
                  <dt>
                    <RouteName grades={data.grades} {gradingScale} route={attempt.route} />
                  </dt>

                  <dd class="text-sm opacity-50">Sessions: {attempt.ascents.length}</dd>
                  <dd class="text-sm opacity-50">
                    Last session: {DateTime.fromSQL(attempt.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
                  </dd>
                </a>

                <ol class="flex items-center gap-2 w-auto pe-4">
                  <li>
                    <a class="anchor" href={attempt.route.block.area.pathname}>
                      {attempt.route.block.area.name}
                    </a>
                  </li>

                  <li class="opacity-50" aria-hidden={true}>&rsaquo;</li>

                  <li>
                    <a class="anchor" href={attempt.route.block.pathname}>
                      {attempt.route.block.name}
                    </a>
                  </li>
                </ol>
              </li>
            {/each}
          </ul>
        </nav>
      </Tabs.Panel>

      <Tabs.Panel value="settings">
        {#if $page.data.session?.user?.email === data.user?.email}
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
        {/if}
      </Tabs.Panel>
    {/snippet}
  </Tabs>
</div>
