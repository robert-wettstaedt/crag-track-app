<script>
  import { page } from '$app/stores'
  import AreaFormFields from '$lib/components/AreaFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit area</span>
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
    <AreaFormFields name={form?.name ?? data.name} type={form?.type ?? data.type} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update area</button>
  </div>
</form>
