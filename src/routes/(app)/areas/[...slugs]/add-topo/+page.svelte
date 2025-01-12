<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import FileBrowser from '$lib/components/FileBrowser'
  import AppBar from '$lib/components/AppBar'

  let { data, form } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}`)

  let filePath = $state(form?.path == null ? null : form.path.toString())
</script>

<svelte:head>
  <title>Edit topos of {data.area.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit topos of</span>
    <a class="anchor" href={basePath}>{data.area.name}</a>
  {/snippet}
</AppBar>

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" method="POST" use:enhance>
  <label class="label">
    <span>Select file</span>
    <input name="path" type="hidden" value={filePath} />
    <FileBrowser bind:value={filePath} />
  </label>

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" disabled={filePath == null} type="submit">Select</button>
  </div>
</form>
