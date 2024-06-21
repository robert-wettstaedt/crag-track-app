<script lang="ts">
  import SaveBouldering from '$lib/assets/Save-Bouldering.jpg'
  import TopoViewer from '$lib/components/TopoViewer/TopoViewer.svelte'
  import '@fortawesome/fontawesome-free/css/all.css'
  import '../../../../../app.postcss'

  export let data
</script>

<section>
  <div class="flex">
    <div class="w-2/4">
      <div class="p-2 mt-8">
        <h1 class="text-center text-3xl">Bouldern in {data.area.name}</h1>
      </div>
    </div>

    <div class="w-2/4">
      <img alt="Save bouldering" class="h-full w-full" src={SaveBouldering} />
    </div>
  </div>
</section>

{#each data.area.blocks as block}
  {#each block.topos as topo}
    <section>
      <div class="flex h-full">
        <div class="w-2/4 px-4">
          <div class="p-2 mt-8">
            <h2 class="text-center text-xl">
              {block.name}
            </h2>

            {#each topo.routes as topoRoute, index}
              {#if topoRoute.route != null}
                <h3 class="text-lg mt-8">
                  <strong>{index + 1}</strong>
                  {topoRoute.route.name}

                  {#if topoRoute.route.grade != null}
                    &nbsp;{topoRoute.route.gradingScale} {topoRoute.route.grade}
                  {/if}
                </h3>

                {#if topoRoute.route.firstAscent}
                  <p class="ms-4">
                    FA:

                    {#if (topoRoute.route.firstAscent.climber?.userName ?? topoRoute.route.firstAscent.climberName) != null}
                      {topoRoute.route.firstAscent.climber?.userName ?? topoRoute.route.firstAscent.climberName}&nbsp;
                    {/if}

                    {#if topoRoute.route.firstAscent.year}
                      {topoRoute.route.firstAscent.year}
                    {/if}
                  </p>
                {/if}

                {#if topoRoute.route.description}
                  <p class="ms-4">{topoRoute.route.description}</p>
                {/if}
              {/if}
            {/each}
          </div>
        </div>

        <div class="w-2/4 h-full relative">
          {#if topo.file?.stat == null}
            <p class="text-center w-full">Error loading file: {topo.file?.error ?? ''}</p>
          {:else}
            <TopoViewer showRouteKey topos={[topo]} />
          {/if}

          {#if block.lat != null && block.long != null}
            <p class="text-xs text-white bg-black/50 p-1 absolute top-4 right-4 z-50">
              <i class="fa-solid fa-location-dot me-2" />{block.lat.toFixed(5)}, {block.long.toFixed(5)}
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
