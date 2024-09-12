<script lang="ts">
  import { page } from '$app/stores'
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import RouteName from '$lib/components/RouteName'
  import Vega from '$lib/components/Vega'
  import { getGradeColor } from '$lib/grades'
  import { AppBar, TabAnchor, TabGroup } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  export let form

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
  <svelte:fragment slot="lead">
    {data.user?.userName}
  </svelte:fragment>
</AppBar>

<div class="card mt-4 p-4">
  <TabGroup>
    <TabAnchor href={$page.url.pathname} selected={$page.url.hash === ''}>Sends</TabAnchor>

    <TabAnchor href={$page.url.pathname + '#open-projects'} selected={$page.url.hash === '#open-projects'}>
      Open projects
    </TabAnchor>

    <TabAnchor href={$page.url.pathname + '#finished-projects'} selected={$page.url.hash === '#finished-projects'}>
      Finished projects
    </TabAnchor>

    {#if $page.data.session?.user?.email === data.user?.email}
      <TabAnchor href={$page.url.pathname + '#settings'} selected={$page.url.hash === '#settings'}>Settings</TabAnchor>
    {/if}

    <svelte:fragment slot="panel">
      {#if $page.url.hash === ''}
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
      {:else if $page.url.hash === '#open-projects'}
        <nav class="list-nav">
          <ul>
            {#each data.openProjects as attempt}
              <li class="flex justify-between w-full hover:bg-primary-500/10">
                <a class="flex flex-col !items-start hover:!bg-transparent" href={attempt.route.pathname}>
                  <dt>
                    <RouteName grades={data.grades} {gradingScale} route={attempt.route} />
                  </dt>

                  <dd class="text-sm opacity-50">Sessions: {attempt.ascents.length}</dd>
                  <dd class="text-sm opacity-50">
                    Last session: {DateTime.fromSQL(attempt.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
                  </dd>
                </a>

                <ol class="breadcrumb w-auto pe-4">
                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.route.block.area.pathname}>
                      {attempt.route.block.area.name}
                    </a>
                  </li>

                  <li class="crumb-separator" aria-hidden>&rsaquo;</li>

                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.route.block.pathname}>
                      {attempt.route.block.name}
                    </a>
                  </li>
                </ol>
              </li>
            {/each}
          </ul>
        </nav>
      {:else if $page.url.hash === '#finished-projects'}
        <nav class="list-nav">
          <ul>
            {#each data.finishedProjects as attempt}
              <li class="flex justify-between w-full hover:bg-primary-500/10">
                <a class="flex flex-col !items-start hover:!bg-transparent" href={attempt.route.pathname}>
                  <dt>
                    <RouteName grades={data.grades} {gradingScale} route={attempt.route} />
                  </dt>

                  <dd class="text-sm opacity-50">Sessions: {attempt.ascents.length}</dd>
                  <dd class="text-sm opacity-50">
                    Last session: {DateTime.fromSQL(attempt.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
                  </dd>
                </a>

                <ol class="breadcrumb w-auto pe-4">
                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.route.block.area.pathname}>
                      {attempt.route.block.area.name}
                    </a>
                  </li>

                  <li class="crumb-separator" aria-hidden>&rsaquo;</li>

                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.route.block.pathname}>
                      {attempt.route.block.name}
                    </a>
                  </li>
                </ol>
              </li>
            {/each}
          </ul>
        </nav>
      {:else if $page.url.hash === '#settings'}
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
              <button class="btn variant-filled-primary" type="submit">
                <i class="fa-solid fa-floppy-disk me-2" />
                Save settings
              </button>
            </div>
          </form>
        {/if}
      {/if}
    </svelte:fragment>
  </TabGroup>
</div>
