<script lang="ts">
  import { page } from '$app/stores'
  import SaveBouldering from '$lib/assets/Save-Bouldering.jpg'
  import AreaBlockListing from '$lib/components/AreaBlockListing'
  import '@fortawesome/fontawesome-free/css/all.css'
  import '../../../../../app.postcss'

  export let data

  const topos =
    data.area.areas.length === 0
      ? data.area.blocks.flatMap((block) => block.topos)
      : data.area.areas.flatMap((area) => area.blocks.flatMap((block) => block.topos))

  let loadedTopos = 0

  $: if (loadedTopos === topos.length) {
    window.print()
  }

  const ALPHABET_START_INDEX = 'a'.charCodeAt(0)
</script>

<section>
  <div class="flex">
    <div class="w-2/4">
      <div class="p-2 pt-8 flex flex-col h-full">
        <h1 class="text-center text-3xl">Bouldern in {data.area.name}</h1>

        <div class="p-2 mt-4">
          <p>{`<Infos über ${data.area.name}>`}</p>
        </div>

        <div class="mt-auto text-right">
          {#if $page.data.session?.user?.email != null}
            <p>
              Kontakt:
              <a class="anchor" href={`mailto:${$page.data.session.user.email}`}>{$page.data.session.user.email}</a>
            </p>
          {/if}

          <p>Version: {new Date().toISOString().split('T')[0]}</p>
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
      blocks={data.area.blocks}
      height="210mm"
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
      on:load={() => loadedTopos++}
    />
  {/each}
{:else}
  <AreaBlockListing
    blocks={data.area.blocks}
    getBlockKey={(_, index) => String.fromCharCode(ALPHABET_START_INDEX + index)}
    name="Blöcke"
    on:load={() => loadedTopos++}
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
