<script lang="ts">
  import type { GetBlockKey } from '$lib/components/BlocksMap'
  import TopoViewer from '$lib/components/TopoViewer'
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedBlock } from '$lib/db/utils'
  import type { TopoDTO } from '$lib/topo'

  type Block = InferResultType<
    'blocks',
    {
      routes: {
        with: {
          firstAscent: {
            with: {
              climber: true
            }
          }
          tags: true
        }
      }
    }
  > &
    EnrichedBlock & { topos: TopoDTO[] }

  export let name: string
  export let blocks: Block[]
  export let getBlockKey: GetBlockKey = null
</script>

<section>
  <h2 class="p-2 text-center text-xl">{name}</h2>

  {#await import('$lib/components/BlocksMap') then BlocksMap}
    <BlocksMap.default
      {blocks}
      {getBlockKey}
      declutter={false}
      height="210mm"
      on:rendercomplete
      showAreas={false}
      zoom={null}
    />
  {/await}
</section>

{#each blocks as block, index}
  {#each block.topos as topo}
    <section>
      <div class="flex h-full">
        <div class="w-2/4 px-4">
          <div class="p-2 mt-8">
            <h2 class="text-center text-xl">
              {getBlockKey?.(block, index)}. {block.name}
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
            <TopoViewer getRouteKey={(_, index) => index + 1} topos={[topo]} on:load />
          {/if}

          {#if block.geolocation?.lat != null && block.geolocation?.long != null}
            <p class="text-xs text-white bg-black/50 p-1 absolute top-4 right-4 z-50">
              <i class="fa-solid fa-location-dot me-2" />
              {block.geolocation.lat.toFixed(5)}, {block.geolocation.long.toFixed(5)}
            </p>
          {/if}
        </div>
      </div>
    </section>
  {/each}
{/each}

<style>
  section {
    break-after: page;
    height: 210mm;
    width: 297mm;
  }
</style>
