<script lang="ts">
  import type { GetBlockKey } from '$lib/components/BlocksMap'
  import TopoViewer from '$lib/components/TopoViewer'
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedBlock } from '$lib/db/utils'
  import { type TopoDTO } from '$lib/topo'
  import { Rating } from '@skeletonlabs/skeleton-svelte'

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

  interface Props {
    name: string
    blocks: Block[]
    getBlockKey?: GetBlockKey
    grades: Grade[]
    gradingScale?: UserSettings['gradingScale']
    onLoadTopo?: () => void
  }

  let { name, blocks, getBlockKey = null, grades, gradingScale = 'FB', onLoadTopo }: Props = $props()
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
                <h3 class="text-lg mt-8 px-2 flex gap-x-2">
                  <strong>{index + 1}</strong>

                  {route.name.length === 0 ? 'Unbekannt' : route.name}

                  {#if route.gradeFk != null}
                    {grades.find((grade) => grade.id === route.gradeFk)?.[gradingScale]}
                  {/if}

                  {#if route.rating != null}
                    <div>
                      <Rating value={route.rating} count={3} readOnly>
                        {#snippet iconFull()}
                          <i class="fa-solid fa-star text-warning-500"></i>
                        {/snippet}
                      </Rating>
                    </div>
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
                  <p class="ms-4">{@html route.description}</p>
                {/if}
              {/if}
            {/each}
          </div>
        </div>

        <div class="w-2/4 h-full relative">
          {#if topo.file?.stat == null}
            <p class="text-center w-full">Error loading file: {topo.file?.error ?? ''}</p>
          {:else}
            <TopoViewer getRouteKey={(_, index) => index + 1} onLoad={onLoadTopo} topos={[topo]} />
          {/if}

          {#if block.geolocation?.lat != null && block.geolocation?.long != null}
            <p
              class="text-xs text-white bg-black/50 p-1 absolute top-4 right-4 z-50"
              style="print-color-adjust: exact !important"
            >
              <i class="fa-solid fa-location-dot"></i>
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
