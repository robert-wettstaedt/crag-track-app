<script>
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import RouteName from '$lib/components/RouteName'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`
</script>

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
      <input class="input" name="path" type="text" placeholder="Path" value={form?.path ?? ''} />
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
    <button class="btn variant-filled-primary">Add file</button>
  </div>
</form>
