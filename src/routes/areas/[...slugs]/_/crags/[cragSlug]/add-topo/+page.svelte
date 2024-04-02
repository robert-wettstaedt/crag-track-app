<script>
  import { page } from '$app/stores'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}`

  let path = form?.path ?? (data.session?.user?.email == null ? '' : `/${data.session.user.email}/`)
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit topos of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.crag.name}</a>
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
    <label class="label">
      <span>New file</span>
      <input class="input" name="path" type="text" placeholder="Path" bind:value={path} />
    </label>
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Add file</button>
  </div>
</form>
