<script lang="ts">
  import type { Crag } from '$lib/db/schema'
  import type { EnrichedCrag } from '$lib/db/utils'
  import Feature from 'ol/Feature.js'
  import Map from 'ol/Map.js'
  import Overlay from 'ol/Overlay.js'
  import View from 'ol/View.js'
  import Point from 'ol/geom/Point.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import 'ol/ol.css'
  import { Projection, addProjection, fromLonLat } from 'ol/proj.js'
  import { register } from 'ol/proj/proj4.js'
  import { Vector as VectorSource, XYZ } from 'ol/source.js'
  import OSM from 'ol/source/OSM'
  import { Fill, Style, Text } from 'ol/style.js'
  import proj4 from 'proj4'
  import { createEventDispatcher } from 'svelte'
  import type { ChangeEventHandler } from 'svelte/elements'

  export let crags: EnrichedCrag[]
  export let selectedCrag: Crag | null = null
  export let heightSubtrahend = 0
  export let height: number | null = null

  proj4.defs(
    'EPSG:31468',
    '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +towgs84=601.0,76.0,424.0,0.93293,0.22792,-1.68951,5.7 +units=m +no_defs +axis=neu',
  )
  register(proj4)

  const projection = new Projection({
    code: 'EPSG:31468',
    extent: [3925712, 4875712, 4974288, 5924288],
    units: 'm',
  })
  addProjection(projection)

  const dispatch = createEventDispatcher<{ action: Map }>()

  let mapElement: HTMLDivElement | null = null
  let map: Map | null = null

  const createMap = (element: HTMLDivElement): Map => {
    const center = {
      lat: selectedCrag?.lat ?? 0,
      lng: selectedCrag?.long ?? 0,
    }

    const map = new Map({
      target: element,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          properties: { isBayerRelief: true },
          opacity: 0.8,
          source: new XYZ({
            urls: ['31', '32', '33', '34', '35', '36', '37', '38', '39', '40'].map(
              (instance) => `https://intergeo${instance}.bayernwolke.de/betty/c_dgm_relief/{z}/{x}/{y}`,
            ),
            projection,
          }),
        }),
      ],
      view: new View({
        center: fromLonLat([center.lng, center.lat]),
        zoom: 10,
      }),
    })

    return map
  }

  const createMarkers = (map: Map) => {
    const iconFeatures = crags
      .map((crag) => {
        if (crag.lat != null && crag.long != null) {
          const iconFeature = new Feature({
            geometry: new Point(fromLonLat([crag.long, crag.lat])),
            crag,
          })

          const iconStyle = new Style({
            text: new Text({
              font: `900 ${crag.id === selectedCrag?.id ? 2.25 : 1.875}rem 'Font Awesome 6 Free'`,
              text: '\uf6fc',
              fill: new Fill({ color: crag.id === selectedCrag?.id ? '#60a5fa' : '#ef4444' }),
            }),
          })

          iconFeature.setStyle(iconStyle)

          return iconFeature
        }
      })
      .filter((d) => d != null) as Feature<Point>[]

    if (iconFeatures.length > 0) {
      const vectorSource = new VectorSource({
        features: iconFeatures,
      })

      const vectorLayer = new VectorLayer({
        source: vectorSource as any,
      })

      map.addLayer(vectorLayer)

      if (selectedCrag == null) {
        window.requestAnimationFrame(() => {
          map.getView().fit(vectorSource.getExtent(), { maxZoom: 10, padding: [50, 50, 50, 50] })
        })
      }
    }
  }

  const createPopup = (map: Map) => {
    const element = document.createElement('div')
    element.className = 'bg-white rounded p-2 anchor'
    map.getTargetElement().appendChild(element)

    const popup = new Overlay({
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      element,
      positioning: 'bottom-center',
      stopEvent: false,
    })

    map.addOverlay(popup)

    map.on('click', function (event) {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature)

      if (feature == null) {
        popup.setPosition(undefined)
      } else {
        const crag = feature.get('crag') as EnrichedCrag
        popup.setPosition(fromLonLat([crag.long!, crag.lat!]))
        element.innerHTML = `<a class="anchor" href="${crag.pathname}">${crag.name}</a>`
      }
    })

    map.on('pointermove', function (event) {
      const target = map.getTarget()

      if (target == null || typeof target === 'string') {
        return
      }

      const pixel = map.getEventPixel(event.originalEvent)
      const hit = map.hasFeatureAtPixel(pixel)

      target.style.cursor = hit ? 'pointer' : ''
    })

    map.on('movestart', () => popup.setPosition(undefined))
  }

  const mapAction = (el: HTMLDivElement) => {
    mapElement = el
    map = createMap(el)
    createMarkers(map)
    createPopup(map)
    resizeMap()

    dispatch('action', map)

    return {
      destroy: () => {
        // map?.remove()
        mapElement = null
        map = null
      },
    }
  }

  function resizeMap() {
    if (mapElement != null) {
      if (height == null) {
        mapElement.style.height = `${window.innerHeight - mapElement.getBoundingClientRect().top - 16 - heightSubtrahend}px`
      } else {
        mapElement.style.height = `${height}px`
      }
    }

    // map?.invalidateSize()
  }

  const onChangeRelief: ChangeEventHandler<HTMLInputElement> = (event) => {
    map
      ?.getAllLayers()
      .find((layer) => layer.get('isBayerRelief'))
      ?.setOpacity(event.currentTarget.checked ? 0.8 : 0)
  }
</script>

<svelte:window on:resize={resizeMap} />

<div class="relative">
  <div class="map w-full -z-0" use:mapAction />

  <div class="absolute top-2 right-2 p-2 bg-surface-500/90 text-white">
    <label class="flex items-center space-x-2">
      <input class="checkbox" checked on:change={onChangeRelief} type="checkbox" />
      <p>Show Bayern relief</p>
    </label>
  </div>
</div>
