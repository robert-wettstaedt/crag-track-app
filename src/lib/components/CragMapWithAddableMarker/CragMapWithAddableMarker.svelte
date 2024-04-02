<script lang="ts">
  import CragMap from '$lib/components/CragMap'
  import type { EnrichedCrag } from '$lib/db/utils'
  import L from 'leaflet'
  import { createEventDispatcher } from 'svelte'

  export let crags: EnrichedCrag[]

  const dispatch = createEventDispatcher<{ change: L.LatLng }>()

  const onAction = ({ detail: map }: CustomEvent<L.Map>) => {
    let marker: L.Marker | null = null

    map.on('click', (event) => {
      latlng = event.latlng

      if (marker == null) {
        marker = L.marker(event.latlng).addTo(map)
      } else {
        marker.setLatLng(event.latlng)
      }

      dispatch('change', latlng)
    })
  }

  let latlng: L.LatLng | null = null
</script>

<CragMap {crags} heightSubtrahend={74} on:action={onAction} />
