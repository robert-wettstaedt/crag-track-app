<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type { File } from '$lib/db/schema'
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte'
  import { createEventDispatcher } from 'svelte'
  import type { FileStat } from 'webdav'

  const dispatcher = createEventDispatcher<{ delete: void }>()

  interface Props {
    children?: import('svelte').Snippet
    file: File
    readOnly?: boolean
    stat: FileStat
  }

  let { children, file, readOnly = true, stat }: Props = $props()

  const search = new URLSearchParams({ file: stat.basename }).toString()
  const resourcePath = `/nextcloud${stat.filename}`

  const onDelete = async () => {
    await fetch(`/api/files/${file.id}`, { method: 'DELETE' })
    goto($page.url.pathname)
    dispatcher('delete')
  }

  let mediaIsLoading = $state(stat.mime?.includes('image') ?? false)
  let mediaHasError = $state(false)
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

<svelte:window onkeyup={(event) => event.key === 'Escape' && goto($page.url.pathname)} />

<a class="card card-hover preset-filled-surface-200-800 overflow-hidden" href={`${$page.url.pathname}/?${search}`}>
  <div class="relative">
    {#if mediaHasError}
      <aside class="alert variant-filled-error">
        <div class="alert-message">
          <h3 class="h3">Unable to play video</h3>
          <p>{stat.basename}</p>
        </div>
      </aside>
    {:else}
      {#if mediaIsLoading}
        <div class="absolute w-full h-full flex justify-center items-center bg-black/10">
          <ProgressRing value={null} />
        </div>
      {/if}
      {#if stat.mime?.includes('image')}
        <img alt={stat.filename} class="h-80" src={resourcePath} height={300} use:mediaAction />
      {:else if stat.mime?.includes('video')}
        <video class="h-80" disablepictureinpicture disableremoteplayback muted use:mediaAction>
          <source src={resourcePath} type={stat.mime} />
          <track kind="captions" />
        </video>
      {:else if stat.mime?.includes('pdf')}
        {#await import('svelte-pdf') then PdfViewer}
          <div class="pdf-wrapper thumbnail">
            <PdfViewer.default data={undefined} url={resourcePath} showBorder={false} showButtons={[]} />
          </div>
        {/await}
      {/if}
    {/if}
  </div>

  {#if children}
    <div class="card-footer p-3">
      {@render children?.()}
    </div>
  {/if}
</a>

{#if $page.url.searchParams.get('file') === stat.basename}
  <div class="fixed top-0 left-0 right-0 bottom-0 z-[5000] p-16 bg-black/90">
    {#if mediaHasError}
      <aside class="alert variant-filled-error">
        <div class="alert-message">
          <h3 class="h3">Unable to play video</h3>
          <p>{stat.filename}</p>
        </div>
      </aside>
    {:else}
      {#if mediaIsLoading}
        <div class="absolute w-full h-full flex justify-center items-center bg-black/80">
          <ProgressRing value={null} />
        </div>
      {/if}
      {#if stat.mime?.includes('image')}
        <img alt={stat.filename} class="h-full w-full object-contain" src={resourcePath} />
      {:else if stat.mime?.includes('video')}
        <video autoplay class="h-full w-full" controls disablepictureinpicture loop>
          <source src={resourcePath} type={stat.mime} />
          <track kind="captions" />
        </video>
      {:else if stat.mime?.includes('pdf')}
        {#await import('svelte-pdf') then PdfViewer}
          <div class="pdf-wrapper">
            <PdfViewer.default data={undefined} url={resourcePath} showButtons={['navigation', 'zoom', 'pageInfo']} />
          </div>
        {/await}
      {/if}
    {/if}

    {#if !readOnly}
      <button
        aria-label="Delete"
        class="btn btn-icon preset-filled-error-500 fixed top-8 right-20 !text-white"
        onclick={onDelete}
        title="Delete"
      >
        <i class="fa-solid fa-trash"></i>
      </button>
    {/if}

    <a
      aria-label="Close"
      class="btn btn-icon preset-filled-primary-500 fixed top-8 right-8"
      href={$page.url.pathname}
      title="Close"
    >
      <i class="fa-solid fa-x"></i>
    </a>
  </div>
{/if}
