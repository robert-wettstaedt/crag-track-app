<script>
  import { enhance } from '$app/forms'
  import TagFormFields from '$lib/components/TagFormFields'
  import { AppBar } from '@skeletonlabs/skeleton-svelte'

  let { form } = $props()
</script>

<svelte:head>
  <title>Create tag - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Create tag</span>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-4 preset-filled-surface-100-900" method="POST" use:enhance>
  <TagFormFields id={form?.id ?? ''} />

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" type="submit">
      <i class="fa-solid fa-floppy-disk"></i> Save tag
    </button>
  </div>
</form>
