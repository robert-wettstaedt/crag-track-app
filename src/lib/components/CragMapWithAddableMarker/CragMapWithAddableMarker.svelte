<script lang="ts">
  import CragMap from '$lib/components/CragMap'
  import type { EnrichedCrag } from '$lib/db/utils'
  import Feature from 'ol/Feature.js'
  import Map from 'ol/Map.js'
  import type { Coordinate } from 'ol/coordinate'
  import Point from 'ol/geom/Point.js'
  import { Vector as VectorLayer } from 'ol/layer.js'
  import { toLonLat } from 'ol/proj'
  import { Vector as VectorSource } from 'ol/source.js'
  import { createEventDispatcher } from 'svelte'

  export let crags: EnrichedCrag[]

  const dispatch = createEventDispatcher<{ change: Coordinate }>()

  const onAction = ({ detail: map }: CustomEvent<Map>) => {
    let marker: Feature<Point> | null = null

    map.on('click', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature)

      if (feature == null) {
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
      }

      dispatch('change', toLonLat(event.coordinate))
    })
  }
</script>

<CragMap {crags} heightSubtrahend={74} on:action={onAction} />
