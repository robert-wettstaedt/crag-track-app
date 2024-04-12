<script lang="ts">
  import { page } from '$app/stores'
  import FirstAscentFormFields from '$lib/components/FirstAscentFormFields'
  import BoulderName from '$lib/components/BoulderName'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/boulders/${$page.params.boulderSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit FA of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <BoulderName boulder={data.boulder} />
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
        data.boulder.firstAscent?.climber?.userName ??
        data.boulder.firstAscent?.climberName}
      users={data.users}
      year={form?.year ?? data.boulder.firstAscent?.year}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update FA</button>
  </div>
</form>
