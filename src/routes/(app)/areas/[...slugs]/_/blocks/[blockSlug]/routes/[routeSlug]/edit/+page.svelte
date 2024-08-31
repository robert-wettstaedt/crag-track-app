<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import RouteFormFields from '$lib/components/RouteFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`
</script>

<svelte:head>
  <title>
    Edit
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {data.route.grade == null ? '' : ` (${data.route.grade} ${data.route.gradingScale})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit route</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName route={data.route} />
    </a>
  </svelte:fragment>
</AppBar>

<form action="?/updateRoute" method="POST" use:enhance>
  {#if form?.error}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <RouteFormFields
      description={form?.description ?? data.route.description}
      grade={form?.grade ?? data.route.grade}
      gradingScale={form?.gradingScale ?? data.route.gradingScale}
      name={form?.name ?? data.route.name}
      rating={form?.rating ?? data.route.rating}
      routeTags={form?.tags ?? data.route.tags.map((tag) => tag.tagFk)}
      tags={data.tags}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>

    <div>
      <button
        class="btn variant-filled-error"
        use:popup={{ event: 'click', target: `popup-delete-route`, placement: 'top' }}
        type="button"
      >
        <i class="fa-solid fa-trash me-2" />Delete route
      </button>

      <button class="btn variant-filled-primary" type="submit">Update route</button>
    </div>
  </div>
</form>

<div class="card p-4 shadow-xl" data-popup="popup-delete-route">
  <p>Are you sure you want to delete this route?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeRoute" use:enhance>
      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>
