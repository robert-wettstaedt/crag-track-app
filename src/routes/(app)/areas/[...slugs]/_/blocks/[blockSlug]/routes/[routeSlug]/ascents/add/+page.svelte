<script lang="ts">
  import { page } from '$app/stores'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'
  import type { ActionData, PageData } from './$types'

  export let data: PageData
  export let form: ActionData
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`
</script>

<svelte:head>
  <title>
    Log ascent of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {data.route.grade == null ? '' : ` (${data.route.grade} ${data.route.gradingScale})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Log ascent of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName route={data.route} />
    </a>
  </svelte:fragment>
</AppBar>

<form method="POST">
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
      grade={form?.grade ?? null}
      gradingScale={data.route.gradingScale}
      notes={form?.notes ?? null}
      type={form?.type ?? null}
      filePaths={form?.filePaths ?? undefined}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Save ascent</button>
  </div>
</form>
