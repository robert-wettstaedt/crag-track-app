<script lang="ts">
  import type { FileStat } from 'webdav'

  export let file: FileStat

  let errored = false
</script>

{#if file.type === 'directory'}
  <i class="fa-solid fa-folder text-3xl" />
{:else if errored}
  {#if file.mime === 'application/pdf'}
    <i class="fa-solid fa-file-pdf text-3xl" />
  {:else if file.mime === 'application/zip'}
    <i class="fa-solid fa-file-zipper text-3xl" />
  {:else if file.mime?.startsWith('image/')}
    <i class="fa-solid fa-image text-3xl" />
  {:else if file.mime?.startsWith('video/')}
    <i class="fa-solid fa-video text-3xl" />
  {:else if file.mime?.startsWith('audio/')}
    <i class="fa-solid fa-music text-3xl" />
  {/if}
{:else}
  <img
    alt=""
    height="32"
    on:error={() => (errored = true)}
    src={`/nextcloud${file.filename}/preview?x=32&y=32&mimeFallback=true&a=0`}
    width="32"
  />
{/if}
