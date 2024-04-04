<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type { File } from '$lib/db/schema'
  import { ProgressRadial } from '@skeletonlabs/skeleton'
  import { createEventDispatcher } from 'svelte'

  const dispatcher = createEventDispatcher<{ delete: void }>()

  export let file: File

  const search = new URLSearchParams({ file: file.path }).toString()
  const resourcePath = `/nextcloud${file.path}`

  const onDelete = async () => {
    await fetch(`/api/files/${file.id}`, { method: 'DELETE' })
    goto($page.url.pathname)
    dispatcher('delete')
  }

  let mediaIsLoading = file.mime?.includes('image') ?? false
  let mediaHasError = false
  const mediaAction = (el: HTMLElement) => {
    const onError = () => (mediaHasError = true)
    const onLoad = () => (mediaIsLoading = false)
    const onLoadStart = () => (mediaIsLoading = true)

    el.addEventListener('error', onError)
    el.addEventListener('load', onLoad)
    el.addEventListener('loadeddata', onLoad)
    el.addEventListener('loadstart', onLoadStart)

    return {
      destroy: () => {
        el.removeEventListener('error', onError)
        el.removeEventListener('load', onLoad)
        el.removeEventListener('loadeddata', onLoad)
        el.removeEventListener('loadstart', onLoadStart)
      },
    }
  }
</script>

<svelte:window on:keyup={(event) => event.key === 'Escape' && goto($page.url.pathname)} />

<a class="card bg-initial card-hover" href={`${$page.url.pathname}/?${search}`}>
  <div class="relative">
    {#if mediaHasError}
      <aside class="alert variant-filled-error">
        <div class="alert-message">
          <h3 class="h3">Unable to play video</h3>
          <p>{file.path}</p>
        </div>
      </aside>
    {:else}
      {#if mediaIsLoading}
        <div class="absolute w-full h-full flex justify-center items-center bg-black/10">
          <ProgressRadial />
        </div>
      {/if}
      {#if file.mime?.includes('image')}
        <img alt={file.path} class="h-80" src={resourcePath} height={300} use:mediaAction />
      {:else if file.mime?.includes('video')}
        <video class="h-80" disablepictureinpicture disableremoteplayback muted use:mediaAction>
          <source src={resourcePath} type={file.mime} />
          <track kind="captions" />
        </video>
      {:else if file.mime?.includes('pdf')}
        {#await import('svelte-pdf') then PdfViewer}
          <div class="pdf-wrapper thumbnail">
            <PdfViewer.default data={undefined} url={resourcePath} showBorder={false} showButtons={[]} />
          </div>
        {/await}
      {/if}
    {/if}
  </div>

  {#if $$slots.default}
    <div class="card-footer pt-3">
      <slot />
    </div>
  {/if}
</a>

{#if $page.url.searchParams.get('file') === file.path}
  <div class="fixed top-0 left-0 right-0 bottom-0 z-[5000] p-16 bg-black/90">
    {#if mediaHasError}
      <aside class="alert variant-filled-error">
        <div class="alert-message">
          <h3 class="h3">Unable to play video</h3>
          <p>{file.path}</p>
        </div>
      </aside>
    {:else}
      {#if mediaIsLoading}
        <div class="absolute w-full h-full flex justify-center items-center bg-black/80">
          <ProgressRadial />
        </div>
      {/if}
      {#if file.mime?.includes('image')}
        <img alt={file.path} class="h-full w-full object-contain" src={resourcePath} />
      {:else if file.mime?.includes('video')}
        <video autoplay class="h-full w-full" controls disablepictureinpicture loop>
          <source src={resourcePath} type={file.mime} />
          <track kind="captions" />
        </video>
      {:else if file.mime?.includes('pdf')}
        {#await import('svelte-pdf') then PdfViewer}
          <div class="pdf-wrapper">
            <PdfViewer.default data={undefined} url={resourcePath} showButtons={['navigation', 'zoom', 'pageInfo']} />
          </div>
        {/await}
      {/if}
    {/if}

    <button class="btn btn-icon variant-filled fixed top-8 right-24" on:click={onDelete} title="Delete">
      <i class="fa-solid fa-trash" />
    </button>

    <a class="btn btn-icon variant-filled-primary fixed top-8 right-8" href={$page.url.pathname} title="Close">
      <i class="fa-solid fa-x" />
    </a>
  </div>
{/if}
