<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import FileBrowser from '$lib/components/FileBrowser'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`

  let filePath = form?.path == null ? null : form.path.toString()
</script>

<svelte:head>
  <title>Edit topos of {data.block.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit topos of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.block.name}</a>
  </svelte:fragment>
</AppBar>

<form method="POST" use:enhance>
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
      <input name="path" type="hidden" value={filePath} />
      <FileBrowser bind:value={filePath} />
    </label>
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" type="submit">Add file</button>
  </div>
</form>
