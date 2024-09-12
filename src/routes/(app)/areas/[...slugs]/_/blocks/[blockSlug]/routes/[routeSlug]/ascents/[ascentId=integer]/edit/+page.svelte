<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, popup } from '@skeletonlabs/skeleton'
  import type { ActionData, PageData } from './$types'

  export let data: PageData
  export let form: ActionData
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`

  $: grade = data.grades.find((grade) => grade.id === data.ascent.route.gradeFk)
</script>

<svelte:head>
  <title>
    Edit ascent of
    {data.ascent.route.rating == null ? '' : `${Array(data.ascent.route.rating).fill('★').join('')} `}
    {data.ascent.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit ascent of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.ascent.route} />
    </a>
  </svelte:fragment>
</AppBar>

<form action="?/updateAscent" method="POST" use:enhance>
  {#if form?.error != null}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <AscentFormFields
      dateTime={form?.dateTime ?? data.ascent.dateTime}
      filePaths={form?.filePaths ??
        (data.ascent.files.length === 0 ? undefined : data.ascent.files.map((file) => file.path))}
      gradeFk={form?.gradeFk ?? data.ascent.gradeFk}
      grades={data.grades}
      gradingScale={data.user?.userSettings?.gradingScale}
      notes={form?.notes ?? data.ascent.notes}
      type={form?.type ?? data.ascent.type}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>

    <div>
      <button
        class="btn variant-filled-error"
        use:popup={{ event: 'click', target: `popup-delete-ascent`, placement: 'top' }}
        type="button"
      >
        <i class="fa-solid fa-trash me-2" />Delete ascent
      </button>

      <button class="btn variant-filled-primary" type="submit">Save ascent</button>
    </div>
  </div>
</form>

<div class="card p-4 shadow-xl" data-popup="popup-delete-ascent">
  <p>Are you sure you want to delete this ascent?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeAscent" use:enhance>
      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>
