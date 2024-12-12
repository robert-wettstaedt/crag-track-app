<script lang="ts">
  import { convertException } from '$lib'
  import { onMount } from 'svelte'
  import { run } from 'svelte/legacy'
  import type { FileStat } from 'webdav'
  import FilePreview from './components/FilePreview'

  interface Props {
    value?: string | null
    onChange?: ((value: string | null) => void) | null
  }

  let { value = $bindable(null), onChange = null }: Props = $props()

  let currentDir: string[] = $state([])
  let data: FileStat[] = $state([])
  let loading = $state(false)
  let error: string | null = $state(null)

  run(() => {
    ;(() => {
      const file = data.at(0)

      if (file?.type === 'file' && currentDir.at(-1) === file?.basename) {
        value = file.filename
        currentDir = value.split('/').filter((d) => d !== '')
      } else {
        value = null
      }

      onChange?.(value)
    })()
  })

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
  <div class="card preset-filled-surface-100-900 py-2 md:py-4 max-w-[calc(100vw-1rem)]">
    <ol class="flex items-center gap-4 px-2 md:px-4">
      <li>
        <button onclick={navigateTo.bind(null, [])}>
          <i class="fa-solid fa-home"></i> All files
        </button>
      </li>

      {#if currentDir.length > 0}
        <li class="opacity-50" aria-hidden="true">&rsaquo;</li>
      {/if}

      {#each currentDir as dir, index}
        <li>
          <button onclick={navigateTo.bind(null, currentDir.slice(0, index + 1))}>{dir}</button>
        </li>

        {#if index !== currentDir.length - 1}
          <li class="opacity-50" aria-hidden="true">&rsaquo;</li>
        {/if}
      {/each}
    </ol>

    <ul class="mt-8 px-2 md:px-4 overflow-x-auto overflow-x-hidden max-h-[300px] md:max-h-[500px]">
      {#if loading}
        {#each { length: 6 } as _}
          <li class="flex items-center gap-4 px-4 py-2 hover:preset-filled-primary-100-900 cursor-pointer">
            <span class="placeholder-circle w-4"></span>

            <span class="flex-auto">
              <div class="placeholder"></div>
            </span>
          </li>
        {/each}
      {:else}
        {#if currentDir.length > 0}
          <li
            class="flex items-center gap-4 px-4 py-2 hover:preset-filled-primary-100-900 cursor-pointer"
            onclick={navigateUp}
            role="presentation"
          >
            <span class="w-8 flex items-center justify-center">
              <i class="fa-solid fa-folder text-3xl"></i>
            </span>

            <span class="flex-auto">..</span>
          </li>
        {/if}

        {#if value == null}
          {#each data as file}
            <li
              class="flex items-center gap-4 px-4 py-2 hover:preset-filled-primary-100-900 cursor-pointer"
              onclick={navigateIn.bind(null, file.basename)}
              role="presentation"
            >
              <span class="w-8 flex items-center justify-center">
                <FilePreview {file} />
              </span>

              <span class="flex-auto overflow-hidden text-ellipsis">{file.basename}</span>
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
  <aside class="card preset-tonal-error">
    <p>{error}</p>
  </aside>
{/if}
