<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import BlockFormFields from '$lib/components/BlockFormFields'

  let { data, form } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}`)
</script>

<svelte:head>
  <title>Create block in {data.area.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Create block in</span>
    <a class="anchor" href={basePath}>{data.area.name}</a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" method="POST" use:enhance>
  <BlockFormFields name={form?.name ?? ''} />

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" type="submit">
      <i class="fa-solid fa-floppy-disk"></i> Save block
    </button>
  </div>
</form>
