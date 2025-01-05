<script lang="ts">
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME, PUBLIC_TOPO_EMAIL } from '$env/static/public'
  import by from '$lib/assets/by.svg'
  import cc from '$lib/assets/cc.svg'
  import logo from '$lib/assets/logo.png'
  import nc from '$lib/assets/nc.svg'
  import sa from '$lib/assets/sa.svg'
  import BlockEntry from '$lib/components/AreaBlockListing/components/BlockEntry/index.js'
  import '@fortawesome/fontawesome-free/css/all.css'
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte'
  import * as domtoimage from 'modern-screenshot'
  import '../../../../../../../../app.postcss'

  let { data } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let dom: HTMLElement
  const date = new Date().toISOString().split('T')[0]
  const DEBUG = false

  let loadedTopos = $state(0)
  let done = $state(false)

  const onLoadTopo = async () => {
    if (++loadedTopos === data.block.topos.length) {
      const dataUrl = await domtoimage.domToPng(dom)

      if (DEBUG) {
        var img = new Image()
        img.src = dataUrl
        document.body.appendChild(img)
      } else {
        const link = document.createElement('a')
        link.download = `${data.block.slug}_${date}.png`
        link.href = dataUrl
        link.click()
      }

      done = true
    }
  }
</script>

<svelte:head>
  <title>Exporting {data.block.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<div class={DEBUG ? undefined : 'overflow-hidden w-full h-full'}>
  {#if !DEBUG}
    <div
      class="absolute top-0 left-0 w-full h-full flex flex-col gap-4 justify-center items-center bg-surface-50-950 z-[100]"
    >
      {#if done}
        Done
        <a class="btn preset-filled-primary-500" href={basePath}>Go back</a>
      {:else}
        <div>
          <ProgressRing value={null} />
        </div>

        Preparing export
      {/if}
    </div>
  {/if}

  <section bind:this={dom} class="p-2 bg-surface-50-950">
    <div class="flex justify-between mb-4">
      <img src={logo} class="w-16" />

      <div class="flex items-center">
        <h1 class="text-2xl text-ellipsis overflow-hidden w-[150mm] whitespace-nowrap">
          {data.block.area.parent?.name} / {data.block.area.name}
        </h1>
      </div>

      <div class="mt-auto text-right">
        <p>Version: {date}</p>

        {#if PUBLIC_TOPO_EMAIL}
          <p>
            Kontakt:
            {PUBLIC_TOPO_EMAIL}
          </p>
        {/if}

        <p class="flex justify-end gap-1">
          Lizenz: CC BY-NC-SA 4.0
          <img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src={cc} alt="" />
          <img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src={by} alt="" />
          <img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src={nc} alt="" />
          <img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src={sa} alt="" />
        </p>
      </div>
    </div>

    <BlockEntry
      block={data.block}
      index={0}
      itemClass="mt-4"
      {onLoadTopo}
      topoViewerProps={{ limitImgHeight: false }}
    />
  </section>
</div>

<style>
  section {
    width: 297mm;
  }
</style>
