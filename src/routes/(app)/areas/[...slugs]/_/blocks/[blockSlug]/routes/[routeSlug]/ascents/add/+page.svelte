<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'
  import type { ActionData, PageData } from './$types'

  interface Props {
    data: PageData
    form: ActionData
  }

  let { data, form }: Props = $props()
  let basePath = $derived(
    `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`,
  )

  let grade = $derived(data.grades.find((grade) => grade.id === data.route.gradeFk))
</script>

<svelte:head>
  <title>
    Log ascent of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - {PUBLIC_APPLICATION_NAME}
  </title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Log ascent of</span>
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.route} />
    </a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" method="POST" use:enhance>
  <AscentFormFields
    dateTime={form?.dateTime ?? DateTime.now().toSQLDate()}
    filePaths={form?.filePaths ?? undefined}
    gradeFk={form?.gradeFk ?? null}
    grades={data.grades}
    gradingScale={data.user?.userSettings?.gradingScale ?? null}
    notes={form?.notes ?? null}
    type={form?.type ?? null}
  />

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" type="submit">Save ascent</button>
  </div>
</form>
