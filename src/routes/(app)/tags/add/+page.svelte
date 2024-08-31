<script>
  import { enhance } from '$app/forms'
  import TagFormFields from '$lib/components/TagFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let form
</script>

<svelte:head>
  <title>Create tag - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Create tag</span>
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
    <TagFormFields id={form?.id ?? ''} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" type="submit">
      <i class="fa-solid fa-floppy-disk me-2" /> Save tag
    </button>
  </div>
</form>
