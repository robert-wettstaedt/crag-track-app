<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import FileBrowser from '$lib/components/FileBrowser'
  import RouteName from '$lib/components/RouteName'

  let { data, form } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let filePath = $state(form?.path == null ? null : form.path.toString())
  let grade = $derived(data.grades.find((grade) => grade.id === data.route.gradeFk))
</script>

<svelte:head>
  <title>
    Edit files of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.gradingScale ?? 'FB']})`}
    - {PUBLIC_APPLICATION_NAME}
  </title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit files of</span>
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.gradingScale} route={data.route} />
    </a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4 whitespace-pre-line">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" method="POST" use:enhance>
  <label class="label grow">
    <span>New file</span>
    <input name="path" type="hidden" value={filePath} />

    <input name="path" type="hidden" value={filePath} />
    <div class="ring ring-surface-800 rounded">
      <FileBrowser bind:value={filePath} />
    </div>
  </label>

  <label class="label mt-4">
    <span>Type</span>
    <select class="select max-h-[300px] overflow-auto" name="type" value={form?.type ?? 'beta'}>
      <option value="beta">Beta</option>
      <option value="topo">Topo</option>
      <option value="other">Other</option>
    </select>
  </label>

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" disabled={filePath == null} type="submit">Select</button>
  </div>
</form>
