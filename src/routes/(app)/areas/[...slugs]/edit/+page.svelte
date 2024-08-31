<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import AreaFormFields from '$lib/components/AreaFormFields'
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}`
</script>

<svelte:head>
  <title>Edit {data.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit area</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.name}</a>
  </svelte:fragment>
</AppBar>

<form action="?/updateArea" method="POST">
  {#if form?.error != null}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <AreaFormFields name={form?.name ?? data.name} type={form?.type ?? data.type} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>

    <div>
      <button
        class="btn variant-filled-error"
        use:popup={{ event: 'click', target: 'popup-delete-area', placement: 'top' }}
        type="button"
      >
        <i class="fa-solid fa-trash me-2" />Delete area
      </button>

      <button class="btn variant-filled-primary" type="submit">Update area</button>
    </div>
  </div>
</form>

<div class="card p-4 shadow-xl" data-popup="popup-delete-area">
  <p>Are you sure you want to delete this area?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeArea" use:enhance>
      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>
