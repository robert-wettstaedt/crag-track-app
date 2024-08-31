<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import BlockFormFields from '$lib/components/BlockFormFields'
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`
</script>

<svelte:head>
  <title>Edit {data.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit block</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.name}</a>
  </svelte:fragment>
</AppBar>

<form action="?/updateBlock" method="POST" use:enhance>
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

    <div>
      <button
        class="btn variant-filled-error"
        use:popup={{ event: 'click', target: 'popup-delete-block', placement: 'top' }}
        type="button"
      >
        <i class="fa-solid fa-trash me-2" />Delete block
      </button>

      <button class="btn variant-filled-primary" type="submit">Update block</button>
    </div>
  </div>
</form>

<div class="card p-4 shadow-xl" data-popup="popup-delete-block">
  <p>Are you sure you want to delete this block?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeBlock" use:enhance>
      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>
