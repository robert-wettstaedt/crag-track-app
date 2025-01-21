<script lang="ts">
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte'

  interface Props {
    path: string | undefined | null
    size: number
  }

  const { path, size }: Props = $props()

  let mediaHasError = $state(false)

  const mediaAction = (el: HTMLElement) => {
    const onError = () => (mediaHasError = true)

    el.addEventListener('error', onError)

    return {
      destroy: () => {
        el.removeEventListener('error', onError)
      },
    }
  }
</script>

{#if path == null || mediaHasError}
  <i class="fa-solid fa-image w-12 h-12 flex items-center justify-center text-white text-[3rem]"></i>
{:else}
  <div class="relative">
    <div class="absolute top-0 right-0">
      <ProgressRing size="size-12" value={null} />
    </div>

    <img
      alt=""
      class="w-12 h-12 z-0 relative"
      src="/nextcloud{path}/preview?x={size}&y={size}&mimeFallback=true&a=0"
      use:mediaAction
    />
  </div>
{/if}
