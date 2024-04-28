<script lang="ts">
  import { page } from '$app/stores'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton'
  import type { ActionData, PageData } from './$types'

  export let data: PageData
  export let form: ActionData
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/routes/${$page.params.routeSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit ascent of</span>
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
      dateTime={form?.dateTime ?? data.ascent.dateTime}
      grade={form?.grade ?? data.ascent.grade}
      gradingScale={data.route.gradingScale}
      notes={form?.notes ?? data.ascent.notes}
      type={form?.type ?? data.ascent.type}
      filePaths={form?.filePaths ?? data.ascent.files.map((file) => file.path)}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Save ascent</button>
  </div>
</form>
