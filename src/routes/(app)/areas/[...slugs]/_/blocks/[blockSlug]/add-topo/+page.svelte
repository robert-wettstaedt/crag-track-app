<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte'

  let { data, form } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let loading = $state(false)
</script>

<svelte:head>
  <title>Edit topos of {data.block.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit topos of</span>
    <a class="anchor" href={basePath}>{data.block.name}</a>
  {/snippet}
</AppBar>

<form
  class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900"
  enctype="multipart/form-data"
  method="POST"
  use:enhance={() => {
    loading = true

    return ({ update }) => {
      loading = false

      return update()
    }
  }}
>
  <label class="label">
    <span class="label-text">File Input</span>
    <input class="input" name="imageFiles" type="file" accept="image/*" multiple required />
  </label>

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" type="submit" disabled={loading}>
      {#if loading}
        <span class="me-2">
          <ProgressRing size="size-4" value={null} />
        </span>
      {/if}

      Add file
    </button>
  </div>
</form>
