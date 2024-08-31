<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import AreaFormFields from '$lib/components/AreaFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}`
</script>

<svelte:head>
  {#if data.parent}
    <title>Create area in {data.parent.name} - Crag Track</title>
  {:else}
    <title>Create area - Crag Track</title>
  {/if}
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Create area</span>
    {#if data.parent != null}
      &nbsp;
      <span>in</span>
      &nbsp;
      <a class="anchor" href={basePath}>{data.parent.name}</a>
    {/if}
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
    <AreaFormFields name={form?.name ?? ''} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" type="submit">
      <i class="fa-solid fa-floppy-disk me-2" /> Save area
    </button>
  </div>
</form>
