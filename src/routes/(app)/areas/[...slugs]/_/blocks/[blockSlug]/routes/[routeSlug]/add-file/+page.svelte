<script>
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import FileBrowser from '$lib/components/FileBrowser'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`

  let filePath = form?.path == null ? null : form.path.toString()
</script>

<svelte:head>
  <title>
    Edit files of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {data.route.grade == null ? '' : ` (${data.route.grade} ${data.route.gradingScale})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit files of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <RouteName route={data.route} />
    </a>
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

  {#if PUBLIC_DEMO_MODE}
    <aside class="alert variant-filled-warning mt-4">
      <i class="fa-solid fa-triangle-exclamation" />

      <div class="alert-message">
        <p>File storage is disabled in demo mode</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8 flex gap-2">
    <label class="label grow">
      <span>New file</span>
      <input name="path" type="hidden" value={filePath} />

      <input name="path" type="hidden" value={filePath} />
      <FileBrowser bind:value={filePath} />
    </label>

    <label class="label">
      <span>Type</span>
      <select class="select" name="type" value={form?.type ?? 'beta'}>
        <option value="beta">Beta</option>
        <option value="topo">Topo</option>
        <option value="other">Other</option>
      </select>
    </label>
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" disabled={filePath == null}>Select</button>
  </div>
</form>
