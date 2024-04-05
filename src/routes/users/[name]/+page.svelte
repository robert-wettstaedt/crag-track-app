<script lang="ts">
  import BoulderName from '$lib/components/BoulderName'
  import Vega from '$lib/components/Vega'
  import { grades } from '$lib/grades.js'
  import { AppBar, Tab, TabGroup } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data

  const ascents = data.sends.map((ascent) => ({
    ...ascent,
    grade: ascent.grade ?? ascent.boulder.grade,
    color: grades.find((grade) => grade[ascent.boulder.gradingScale] === ascent.grade)?.color,
  }))

  let tabSet: number = 0
</script>

<AppBar>
  <svelte:fragment slot="lead">
    {data.user.userName}
  </svelte:fragment>
</AppBar>

<div class="card mt-4 p-4">
  <TabGroup>
    <Tab bind:group={tabSet} name="tab1" value={0}>Sends</Tab>
    <Tab bind:group={tabSet} name="tab2" value={1}>Open projects</Tab>
    <Tab bind:group={tabSet} name="tab3" value={2}>Finished projects</Tab>

    <svelte:fragment slot="panel">
      {#if tabSet === 0}
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
      {:else if tabSet === 1}
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

                <a class="hover:!bg-transparent" href={attempt.boulder.crag.pathname}>
                  {attempt.boulder.crag.name}
                </a>
              </li>
            {/each}
          </ul>
        </nav>
      {:else if tabSet === 2}
        <nav class="list-nav">
          <ul>
            {#each data.finishedProjects as attempt}
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

                <a class="hover:!bg-transparent" href={attempt.boulder.crag.pathname}>
                  {attempt.boulder.crag.name}
                </a>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}
    </svelte:fragment>
  </TabGroup>
</div>
