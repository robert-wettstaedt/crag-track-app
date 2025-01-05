<script lang="ts">
  import { PUBLIC_APPLICATION_NAME, PUBLIC_TOPO_EMAIL } from '$env/static/public'
  import SaveBouldering from '$lib/assets/Save-Bouldering.jpg'
  import AreaBlockListing from '$lib/components/AreaBlockListing'
  import '@fortawesome/fontawesome-free/css/all.css'
  import '../../../../../app.postcss'

  let { data } = $props()

  const noTopos = (
    data.area.areas.length === 0
      ? data.area.blocks.flatMap((block) => block.topos)
      : data.area.areas.flatMap((area) => area.blocks.flatMap((block) => block.topos))
  ).length

  const noMaps = data.area.areas.length === 0 ? 2 : data.area.areas.length + 1

  let loadedTopos = $state(0)
  let loadedMaps = $state(0)

  $effect(() => {
    if (loadedTopos === noTopos && loadedMaps === noMaps) {
      window.print()
    }
  })

  const ALPHABET_START_INDEX = 'a'.charCodeAt(0)
</script>

<svelte:head>
  <title>Exporting {data.area.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<section>
  <div class="flex">
    <div class="w-2/4">
      <div class="p-2 pt-8 flex flex-col h-full">
        <h1 class="text-center text-4xl">{data.area.name}</h1>
        <h1 class="text-center text-3xl">Bouldering</h1>

        <div class="p-2 mt-4">
          {#if data.area.description != null && data.area.description.length > 0}
            <div class="rendered-markdown mt-4">
              {@html data.area.description}
            </div>
          {/if}
        </div>

        <div class="mt-auto text-right">
          <p>Version: {new Date().toISOString().split('T')[0]}</p>

          {#if PUBLIC_TOPO_EMAIL}
            <p>
              Kontakt:
              <a class="anchor" href={`mailto:${PUBLIC_TOPO_EMAIL}`}>{PUBLIC_TOPO_EMAIL}</a>
            </p>
          {/if}

          <p class="flex justify-end gap-1">
            Lizenz:
            <a
              class="anchor flex"
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/?ref=chooser-v1"
              target="_blank"
              rel="license noopener noreferrer"
            >
              CC BY-NC-SA 4.0
              <img
                style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
                src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"
                alt=""
              />
              <img
                style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
                src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"
                alt=""
              />
              <img
                style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
                src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1"
                alt=""
              />
              <img
                style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
                src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1"
                alt=""
              />
            </a>
          </p>
        </div>
      </div>
    </div>

    <div class="w-2/4">
      <img alt="Save bouldering" class="h-full w-full" src={SaveBouldering} />
    </div>
  </div>
</section>

<section>
  <h2 class="p-2 text-center text-xl">Karte</h2>

  {#await import('$lib/components/BlocksMap') then BlocksMap}
    <BlocksMap.default
      collapsibleAttribution={false}
      blocks={data.area.blocks}
      height="210mm"
      on:rendercomplete={() => loadedMaps++}
      parkingLocations={data.area.parkingLocations}
      selectedArea={data.area}
      showBlocks={false}
      showRelief={false}
      zoom={16}
    />
  {/await}
</section>

{#if data.area.areas.length > 0}
  {#each data.area.areas as area}
    <AreaBlockListing
      blocks={area.blocks}
      getBlockKey={(_, index) => String.fromCharCode(ALPHABET_START_INDEX + index)}
      name={area.name}
      onLoadTopo={() => loadedTopos++}
      on:rendercomplete={() => loadedMaps++}
    />
  {/each}
{:else}
  <AreaBlockListing
    blocks={data.area.blocks}
    getBlockKey={(_, index) => String.fromCharCode(ALPHABET_START_INDEX + index)}
    name="Blöcke"
    onLoadTopo={() => loadedTopos++}
    on:rendercomplete={() => loadedMaps++}
  />
{/if}

<style>
  @page {
    size: A4 landscape;
    margin: 0;
  }

  section {
    break-after: page;
    height: 210mm;
    width: 297mm;
  }

  @media print {
    :global(html, body) {
      overflow: auto !important;
      height: auto !important;
      width: auto !important;
    }

    :global(body) {
      background: none !important;
      color: #000 !important;
    }
  }
</style>
