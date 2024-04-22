<script lang="ts">
  import { page } from '$app/stores'
  import BoulderFormFields from '$lib/components/BoulderFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let form
  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Create boulder in</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.crag.name}</a>
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
    <BoulderFormFields grade={form?.grade ?? null} gradingScale={form?.gradingScale} name={form?.name ?? ''} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Save boulder</button>
  </div>
</form>
