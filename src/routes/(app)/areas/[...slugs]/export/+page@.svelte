<script lang="ts">
  import { page } from '$app/stores'
  import SaveBouldering from '$lib/assets/Save-Bouldering.jpg'
  import TopoViewer from '$lib/components/TopoViewer'
  import '@fortawesome/fontawesome-free/css/all.css'
  import '../../../../../app.postcss'

  export let data

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
      showRelief={false}
      zoom={16}
    />
  {/await}
</section>

<section>
  <h2 class="p-2 text-center text-xl">Blöcke</h2>

  {#await import('$lib/components/BlocksMap') then BlocksMap}
    <BlocksMap.default
      blocks={data.area.blocks}
      declutter={false}
      getBlockKey={(_, index) => String.fromCharCode(ALPHABET_START_INDEX + index)}
      height="210mm"
      zoom={null}
    />
  {/await}
</section>

{#each data.area.blocks as block, index}
  {#each block.topos as topo}
    <section>
      <div class="flex h-full">
        <div class="w-2/4 px-4">
          <div class="p-2 mt-8">
            <h2 class="text-center text-xl">
              {String.fromCharCode(ALPHABET_START_INDEX + index)}. {block.name}
            </h2>

            {#each topo.routes.map( (topoRoute) => block.routes.find((route) => route.id === topoRoute.routeFk), ) as route, index}
              {#if route != null}
                <h3 class="text-lg mt-8">
                  <strong>{index + 1}</strong>
                  {route.name.length === 0 ? 'Unbekannt' : route.name}

                  {#if route.grade != null}
                    &nbsp;{route.gradingScale} {route.grade}
                  {/if}
                </h3>

                {#if route.firstAscent}
                  <p class="ms-4">
                    FA:

                    {#if (route.firstAscent.climber?.userName ?? route.firstAscent.climberName) != null}
                      {route.firstAscent.climber?.userName ?? route.firstAscent.climberName}&nbsp;
                    {/if}

                    {#if route.firstAscent.year}
                      {route.firstAscent.year}
                    {/if}
                  </p>
                {/if}

                {#if route.tags.length > 0}
                  <div class="flex gap-2 ms-4">
                    {#each route.tags as tag}
                      <p>#{tag.tagFk}</p>
                    {/each}
                  </div>
                {/if}

                {#if route.description}
                  <p class="ms-4">{route.description}</p>
                {/if}
              {/if}
            {/each}
          </div>
        </div>

        <div class="w-2/4 h-full relative">
          {#if topo.file?.stat == null}
            <p class="text-center w-full">Error loading file: {topo.file?.error ?? ''}</p>
          {:else}
            <TopoViewer getRouteKey={(_, index) => index + 1} topos={[topo]} />
          {/if}

          {#if block.geolocation?.lat != null && block.geolocation?.long != null}
            <p class="text-xs text-white bg-black/50 p-1 absolute top-4 right-4 z-50">
              <i class="fa-solid fa-location-dot me-2" />{block.geolocation.lat.toFixed(5)}, {block.geolocation.long.toFixed(
                5,
              )}
            </p>
          {/if}
        </div>
      </div>
    </section>
  {/each}
{/each}

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
