<script>
  import CragFormFields from '$lib/components/CragFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let form
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <button class="btn" on:click={() => history.back()} type="button">
      <i class="fa-solid fa-arrow-left text-2xl" />
    </button>
  </svelte:fragment>

  Create crag
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
    <CragFormFields name={form?.name ?? ''} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary"><i class="fa-solid fa-floppy-disk me-2" /> Save crag</button>
  </div>
</form>
