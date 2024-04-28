<script lang="ts">
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import Vega from '$lib/components/Vega'
  import { grades } from '$lib/grades.js'
  import { AppBar, TabAnchor, TabGroup } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data

  const ascents = data.sends.map((ascent) => ({
    ...ascent,
    grade: ascent.grade ?? ascent.route.grade,
    color: grades.find((grade) => grade[ascent.route.gradingScale] === ascent.grade)?.color,
  }))
</script>

<AppBar>
  <svelte:fragment slot="lead">
    {data.user.userName}
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
                  domain: grades.map((grade) => grade.FB),
                  range: grades.map((grade) => grade.color),
                },
              },
              x: {
                field: 'grade',
                scale: {
                  domain: grades.map((grade) => grade.FB),
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
                    <RouteName route={attempt.route} />
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
                    <RouteName
                      route={attempt.route}
                      ascent={attempt.ascents.find((ascent) => ascent.type === 'send')}
                    />
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
      {/if}
    </svelte:fragment>
  </TabGroup>
</div>
