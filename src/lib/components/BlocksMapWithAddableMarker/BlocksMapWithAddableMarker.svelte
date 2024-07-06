<script lang="ts">
  import BlocksMap from '$lib/components/BlocksMap'
  import type { Area } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedBlock } from '$lib/db/utils'
  import Feature from 'ol/Feature.js'
  import Map from 'ol/Map.js'
  import type { Coordinate } from 'ol/coordinate'
  import Point from 'ol/geom/Point.js'
  import { Vector as VectorLayer } from 'ol/layer.js'
  import { toLonLat } from 'ol/proj'
  import { Vector as VectorSource } from 'ol/source.js'
  import { createEventDispatcher } from 'svelte'

  export let blocks: EnrichedBlock[]
  export let selectedArea: Area | null = null
  export let selectedBlock: InferResultType<'blocks', { geolocation: true }> | null = null

  const dispatch = createEventDispatcher<{ change: Coordinate }>()

  const onAction = ({ detail: map }: CustomEvent<Map>) => {
    let marker: Feature<Point> | null = null

    map.on('click', (event) => {
      if (marker == null) {
        marker = new Feature({
          geometry: new Point(event.coordinate),
        })

        const vectorSource = new VectorSource({
          features: [marker],
        })

        const vectorLayer = new VectorLayer({
          source: vectorSource as any,
        })

        map.addLayer(vectorLayer)
      } else {
        marker.getGeometry()?.setCoordinates(event.coordinate)
      }

      dispatch('change', toLonLat(event.coordinate))
    })
  }
</script>

<BlocksMap {blocks} heightSubtrahend={74} {selectedArea} {selectedBlock} on:action={onAction} />
