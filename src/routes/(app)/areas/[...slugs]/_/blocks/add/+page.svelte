<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import BlockFormFields from '$lib/components/BlockFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}`
</script>

<svelte:head>
  <title>Create block in {data.area.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Create block in</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.area.name}</a>
  </svelte:fragment>
</AppBar>

<form method="POST" use:enhance>
  {#if form?.error}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <BlockFormFields name={form?.name ?? ''} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" type="submit">
      <i class="fa-solid fa-floppy-disk me-2" /> Save block
    </button>
  </div>
</form>
