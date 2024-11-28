<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import FileBrowser from '$lib/components/FileBrowser'
  import { AppBar } from '@skeletonlabs/skeleton-svelte'

  let { data, form } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let filePath = $state(form?.path == null ? null : form.path.toString())
</script>

<svelte:head>
  <title>Edit topos of {data.block.name} - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit topos of</span>
    <a class="anchor" href={basePath}>{data.block.name}</a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4">
    <p>{form.error}</p>
  </aside>
{/if}

{#if PUBLIC_DEMO_MODE}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4 flex items-center gap-2">
    <i class="fa-solid fa-triangle-exclamation"></i>

    <p>File storage is disabled in demo mode</p>
  </aside>
{/if}

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" method="POST" use:enhance>
  <label class="label">
    <span>New file</span>
    <input name="path" type="hidden" value={filePath} />
    <FileBrowser bind:value={filePath} />
  </label>

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" type="submit">Add file</button>
  </div>
</form>
