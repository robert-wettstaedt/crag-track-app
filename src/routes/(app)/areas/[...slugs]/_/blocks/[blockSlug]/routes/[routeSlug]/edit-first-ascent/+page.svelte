<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import FirstAscentFormFields from '$lib/components/FirstAscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`

  $: grade = data.grades.find((grade) => grade.id === data.route.gradeFk)
</script>

<svelte:head>
  <title>
    Edit FA of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit FA of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.route} />
    </a>
  </svelte:fragment>
</AppBar>

<form action="?/updateFirstAscent" method="POST" use:enhance>
  {#if form?.error}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <FirstAscentFormFields
      climberName={form?.climberName ??
        data.route.firstAscent?.climber?.userName ??
        data.route.firstAscent?.climberName}
      climbers={data.climbers}
      year={form?.year ?? data.route.firstAscent?.year}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>

    <div>
      <button
        class="btn variant-filled-error"
        use:popup={{ event: 'click', target: `popup-delete-fa`, placement: 'top' }}
        type="button"
      >
        <i class="fa-solid fa-trash me-2" />Delete FA
      </button>

      <button class="btn variant-filled-primary" type="submit">Update FA</button>
    </div>
  </div>
</form>

<div class="card p-4 shadow-xl" data-popup="popup-delete-fa">
  <p>Are you sure you want to delete this FA?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeFirstAscent" use:enhance>
      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>
