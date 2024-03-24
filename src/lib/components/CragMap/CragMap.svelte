<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import CragMarkerPopup from './components/CragMarkerPopup'

  export let crags: InferResultType<'crags', { parentArea: true }>[]

  let element: HTMLDivElement | null = null
  let map: L.Map | null = null

  const createMap = (element: HTMLDivElement): L.Map => {
    const map = L.map(element, { preferCanvas: true }).setView([0, 0], 0)

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
          const marker = L.marker([crag.lat, crag.long], { alt: crag.name })

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
      map.fitBounds(featureGroup.getBounds(), { maxZoom: 10 })
    }
  }

  const mapAction = (el: HTMLDivElement) => {
    element = el
    map = createMap(el)
    createMarkers(map)
    resizeMap()

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
      element.style.height = `${window.innerHeight - element.getBoundingClientRect().top - 16}px`
    }

    map?.invalidateSize()
  }
</script>

<svelte:window on:resize={resizeMap} />

<div class="map w-full" use:mapAction />
