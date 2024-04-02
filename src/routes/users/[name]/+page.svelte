<script lang="ts">
  import Vega from '$lib/components/Vega'
  import { grades } from '$lib/grades.js'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data

  const ascents = data.user.ascents.map((ascent) => ({
    ...ascent,
    color: grades.find((grade) => grade[ascent.parentBoulder.gradingScale] === ascent.grade)?.color,
  }))
</script>

<AppBar>
  <svelte:fragment slot="lead">
    {data.user.userName}
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Ascents</div>

  <section class="p-4">
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
  </section>
</div>
