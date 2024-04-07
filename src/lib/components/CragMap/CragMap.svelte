<script lang="ts">
  import type { Crag } from '$lib/db/schema'
  import type { EnrichedCrag } from '$lib/db/utils'
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import { createEventDispatcher } from 'svelte'
  import CragMarkerPopup from './components/CragMarkerPopup'

  export let crags: EnrichedCrag[]
  export let selectedCrag: Crag | null = null
  export let heightSubtrahend = 0
  export let height: number | null = null

  const dispatch = createEventDispatcher<{ action: L.Map }>()

  let element: HTMLDivElement | null = null
  let map: L.Map | null = null

  const createMap = (element: HTMLDivElement): L.Map => {
    const center = {
      lat: selectedCrag?.lat ?? 0,
      lng: selectedCrag?.long ?? 0,
    }

    const map = L.map(element, { preferCanvas: true }).setView(center, 10)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    return map
  }

  // Create a popup with a Svelte component inside it and handle removal when the popup is torn down.
  // `createFn` will be called whenever the popup is being created, and should create and return the component.
  function bindPopup(marker: L.Marker, createFn: (el: HTMLDivElement) => CragMarkerPopup) {
    let popupComponent: CragMarkerPopup | null

    marker.bindPopup(() => {
      let container = L.DomUtil.create('div')
      popupComponent = createFn(container)
      return container
    })

    marker.on('popupclose', () => {
      if (popupComponent) {
        let old = popupComponent
        popupComponent = null
        // Wait to destroy until after the fadeout completes.
        setTimeout(() => {
          old.$destroy()
        }, 500)
      }
    })
  }

  const createMarkers = (map: L.Map) => {
    const markers = crags
      .map((crag) => {
        if (crag.lat != null && crag.long != null) {
          const icon = L.divIcon({
            className: crag.id === selectedCrag?.id ? 'text-4xl text-blue-400' : 'text-3xl text-red-500',
            html: '<i class="fa-solid fa-mountain"></i>',
            iconSize: [36, 36],
          })
          const marker = L.marker([crag.lat, crag.long], { alt: crag.name, icon })

          bindPopup(marker, (el) => {
            return new CragMarkerPopup({
              target: el,
              props: { crag },
            })
          })

          return marker
        }
      })
      .filter((d) => d != null) as L.Marker[]

    if (markers.length > 0) {
      const featureGroup = L.featureGroup(markers).addTo(map)

      if (selectedCrag == null) {
        map.fitBounds(featureGroup.getBounds().pad(0.05), { maxZoom: 10 })
      }
    }
  }

  const mapAction = (el: HTMLDivElement) => {
    element = el
    map = createMap(el)
    resizeMap()
    createMarkers(map)

    dispatch('action', map)

    return {
      destroy: () => {
        map?.remove()
        element = null
        map = null
      },
    }
  }

  function resizeMap() {
    if (element != null) {
      if (height == null) {
        element.style.height = `${window.innerHeight - element.getBoundingClientRect().top - 16 - heightSubtrahend}px`
      } else {
        element.style.height = `${height}px`
      }
    }

    map?.invalidateSize()
  }
</script>

<svelte:window on:resize={resizeMap} />

<div class="map w-full -z-0" use:mapAction />
