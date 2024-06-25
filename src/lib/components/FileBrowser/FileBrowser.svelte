<script lang="ts">
  import { convertException } from '$lib'
  import { onMount } from 'svelte'
  import type { FileStat } from 'webdav'
  import FilePreview from './components/FilePreview'

  export let value: string | null = null
  export let onChange: ((value: string | null) => void) | null = null

  let currentDir: string[] = []
  let data: FileStat[] = []
  let loading = false
  let error: string | null = null

  $: (() => {
    const file = data.at(0)

    if (file?.type === 'file' && currentDir.at(-1) === file?.basename) {
      value = file.filename
      currentDir = value.split('/').filter((d) => d !== '')
    } else {
      value = null
    }

    onChange?.(value)
  })()

  const fetchData = async () => {
    loading = true
    error = null
    data = []

    try {
      const searchParams = new URLSearchParams({ dir: '/' + currentDir.join('/') })
      const response = await fetch(`/api/files?${searchParams}`)

      if (response.status === 200) {
        data = await response.json()
      } else {
        error = await response.text()
      }
    } catch (exception) {
      error = convertException(exception)
    } finally {
      loading = false
    }
  }

  const navigateTo = (dir: string[], event: Event) => {
    event.preventDefault()
    currentDir = dir
    fetchData()
  }

  const navigateIn = (dir: string, event: Event) => {
    event.preventDefault()
    currentDir = [...currentDir, dir]
    fetchData()
  }

  const navigateUp = (event: Event) => {
    event.preventDefault()
    currentDir = currentDir.slice(0, -1)
    fetchData()
  }

  onMount(() => fetchData())
</script>

{#if error == null}
  <div class="card p-4">
    <ol class="breadcrumb">
      <li class="crumb">
        <button on:click={navigateTo.bind(null, [])}>
          <i class="fa-solid fa-home" /> All files
        </button>
      </li>

      {#if currentDir.length > 0}
        <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
      {/if}

      {#each currentDir as dir, index}
        <li class="crumb">
          <button on:click={navigateTo.bind(null, currentDir.slice(0, index + 1))}>{dir}</button>
        </li>

        {#if index !== currentDir.length - 1}
          <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
        {/if}
      {/each}
    </ol>

    <ul class="list mt-8">
      {#if loading}
        {#each { length: 6 } as _}
          <li class="px-4 py-2 hover:bg-primary-500/10 cursor-pointer">
            <span class="placeholder-circle w-4" />

            <span class="flex-auto">
              <div class="placeholder" />
            </span>
          </li>
        {/each}
      {:else}
        {#if currentDir.length > 0}
          <li class="px-4 py-2 hover:bg-primary-500/10 cursor-pointer" on:click={navigateUp} role="presentation">
            <span class="w-8 flex items-center justify-center">
              <i class="fa-solid fa-folder text-3xl" />
            </span>

            <span class="flex-auto">..</span>
          </li>
        {/if}

        {#if value == null}
          {#each data as file}
            <li
              class="px-4 py-2 hover:bg-primary-500/10 cursor-pointer"
              on:click={navigateIn.bind(null, file.basename)}
              role="presentation"
            >
              <span class="w-8 flex items-center justify-center">
                <FilePreview {file} />
              </span>

              <span class="flex-auto">{file.basename}</span>
            </li>
          {/each}
        {/if}
      {/if}
    </ul>

    {#if value != null}
      <div class="flex justify-center items-center">
        <img alt="" height="512" src={`/nextcloud${value}/preview?x=512&y=512&mimeFallback=true&a=0`} width="512" />
      </div>
    {/if}
  </div>
{:else}
  <aside class="alert variant-filled-error">
    <div class="alert-message">
      <p>{error}</p>
    </div>
  </aside>
{/if}
