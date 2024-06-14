<script lang="ts">
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import FirstAscentFormFields from '$lib/components/FirstAscentFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit FA of</span>
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
    <FirstAscentFormFields
      climberName={form?.climberName ??
        data.route.firstAscent?.climber?.userName ??
        data.route.firstAscent?.climberName}
      users={data.users}
      year={form?.year ?? data.route.firstAscent?.year}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update FA</button>
  </div>
</form>
