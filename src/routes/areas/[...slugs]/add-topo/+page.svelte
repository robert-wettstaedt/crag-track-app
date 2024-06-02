<script>
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit topos of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.area.name}</a>
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
    {#if PUBLIC_DEMO_MODE}
      <aside class="alert variant-filled-warning mb-4">
        <i class="fa-solid fa-triangle-exclamation" />

        <div class="alert-message">
          <p>File storage is disabled in demo mode</p>
        </div>
      </aside>
    {/if}

    <label class="label">
      <span>New file</span>
      <input class="input" name="path" type="text" placeholder="Path" value={form?.path ?? ''} />
    </label>
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Add file</button>
  </div>
</form>
