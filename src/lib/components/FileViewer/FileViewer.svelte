<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type { File } from '$lib/db/schema'
  import { createEventDispatcher } from 'svelte'

  const dispatcher = createEventDispatcher<{ delete: void }>()

  export let file: File
  export let content: string

  const search = new URLSearchParams({ file: file.path }).toString()

  const onDelete = async () => {
    await fetch(`/api/files/${file.id}`, { method: 'DELETE' })
    goto($page.url.pathname)
    dispatcher('delete')
  }
</script>

<svelte:window on:keyup={(event) => event.key === 'Escape' && goto($page.url.pathname)} />

<a class="card bg-initial card-hover" href={`${$page.url.pathname}/?${search}`}>
  {#if file.mime?.includes('image')}
    <img alt={file.path} class="h-80" src={`data:${file.mime};base64,${content}`} height={300} />
  {:else if file.mime?.includes('video')}
    <video class="h-80" src={`data:${file.mime};base64,${content}`}>
      <track kind="captions" />
    </video>
  {:else if file.mime?.includes('pdf')}
    {#await import('svelte-pdf') then PdfViewer}
      <div class="pdf-wrapper thumbnail">
        <PdfViewer.default data={atob(content)} url={undefined} showBorder={false} showButtons={[]} />
      </div>
    {/await}
  {/if}

  {#if $$slots.default}
    <div class="card-footer pt-3">
      <slot />
    </div>
  {/if}
</a>

{#if $page.url.searchParams.get('file') === file.path}
  <div class="fixed top-0 left-0 right-0 bottom-0 z-[5000] p-16 bg-black/90">
    {#if file.mime?.includes('image')}
      <img alt={file.path} class="h-full w-full object-contain" src={`data:${file.mime};base64,${content}`} />
    {:else if file.mime?.includes('video')}
      <video autoplay class="h-full w-full" controls src={`data:${file.mime};base64,${content}`}>
        <track kind="captions" />
      </video>
    {:else if file.mime?.includes('pdf')}
      {#await import('svelte-pdf') then PdfViewer}
        <div class="pdf-wrapper">
          <PdfViewer.default data={atob(content)} url={undefined} showButtons={['navigation', 'zoom', 'pageInfo']} />
        </div>
      {/await}
    {/if}

    <button class="btn btn-icon variant-filled fixed top-8 right-24" on:click={onDelete} title="Delete">
      <i class="fa-solid fa-trash" />
    </button>

    <a class="btn btn-icon variant-filled-primary fixed top-8 right-8" href={$page.url.pathname} title="Close">
      <i class="fa-solid fa-x" />
    </a>
  </div>
{/if}
