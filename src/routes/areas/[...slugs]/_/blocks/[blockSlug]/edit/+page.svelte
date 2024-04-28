<script>
  import { page } from '$app/stores'
  import BlockFormFields from '$lib/components/BlockFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit block</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.name}</a>
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
    <BlockFormFields name={form?.name ?? data.name} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update block</button>
  </div>
</form>
