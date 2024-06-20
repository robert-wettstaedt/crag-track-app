<script lang="ts">
  import { page } from '$app/stores'
  import RouteFormFields from '$lib/components/RouteFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit route</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName route={data.route} />
    </a>
  </svelte:fragment>
</AppBar>

<form method="POST">
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
      routeTags={form?.tags ?? data.route.tags.map((tag) => tag.tagFk)}
      tags={data.tags}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update route</button>
  </div>
</form>
