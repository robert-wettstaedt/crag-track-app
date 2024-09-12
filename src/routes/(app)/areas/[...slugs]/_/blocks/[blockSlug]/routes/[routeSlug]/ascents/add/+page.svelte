<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'
  import type { ActionData, PageData } from './$types'

  export let data: PageData
  export let form: ActionData
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`

  $: grade = data.grades.find((grade) => grade.id === data.route.gradeFk)
</script>

<svelte:head>
  <title>
    Log ascent of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Log ascent of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.route} />
    </a>
  </svelte:fragment>
</AppBar>

<form method="POST" use:enhance>
  {#if form?.error != null}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <AscentFormFields
      dateTime={form?.dateTime ?? DateTime.now().toSQLDate()}
      filePaths={form?.filePaths ?? undefined}
      gradeFk={form?.gradeFk ?? null}
      grades={data.grades}
      gradingScale={data.user?.userSettings?.gradingScale ?? null}
      notes={form?.notes ?? null}
      type={form?.type ?? null}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" type="submit">Save ascent</button>
  </div>
</form>
