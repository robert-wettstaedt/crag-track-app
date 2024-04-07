<script lang="ts">
  import { page } from '$app/stores'
  import BoulderName from '$lib/components/BoulderName'
  import Vega from '$lib/components/Vega'
  import { grades } from '$lib/grades.js'
  import { AppBar, TabAnchor, TabGroup } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data

  const ascents = data.sends.map((ascent) => ({
    ...ascent,
    grade: ascent.grade ?? ascent.boulder.grade,
    color: grades.find((grade) => grade[ascent.boulder.gradingScale] === ascent.grade)?.color,
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
                <a class="flex flex-col !items-start hover:!bg-transparent" href={attempt.boulder.pathname}>
                  <dt>
                    <BoulderName boulder={attempt.boulder} />
                  </dt>

                  <dd class="text-sm opacity-50">Sessions: {attempt.ascents.length}</dd>
                  <dd class="text-sm opacity-50">
                    Last session: {DateTime.fromSQL(attempt.ascents[0].dateTime).toLocaleString(DateTime.DATE_FULL)}
                  </dd>
                </a>

                <ol class="breadcrumb w-auto pe-4">
                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.boulder.crag.area.pathname}>
                      {attempt.boulder.crag.area.name}
                    </a>
                  </li>

                  <li class="crumb-separator" aria-hidden>&rsaquo;</li>

                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.boulder.crag.pathname}>
                      {attempt.boulder.crag.name}
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
                <a class="flex flex-col !items-start hover:!bg-transparent" href={attempt.boulder.pathname}>
                  <dt>
                    <BoulderName
                      boulder={attempt.boulder}
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
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.boulder.crag.area.pathname}>
                      {attempt.boulder.crag.area.name}
                    </a>
                  </li>

                  <li class="crumb-separator" aria-hidden>&rsaquo;</li>

                  <li class="crumb">
                    <a class="anchor !p-0 hover:!bg-transparent" href={attempt.boulder.crag.pathname}>
                      {attempt.boulder.crag.name}
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
