<script lang="ts">
  import type { Area, Geolocation } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedArea, EnrichedBlock } from '$lib/db/utils'
  import Feature from 'ol/Feature.js'
  import OlMap from 'ol/Map.js'
  import Overlay from 'ol/Overlay.js'
  import View from 'ol/View.js'
  import type { Coordinate } from 'ol/coordinate'
  import { boundingExtent } from 'ol/extent'
  import { Geometry } from 'ol/geom'
  import Point from 'ol/geom/Point.js'
  import { fromExtent } from 'ol/geom/Polygon'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import 'ol/ol.css'
  import { Projection, addProjection, fromLonLat } from 'ol/proj.js'
  import { register } from 'ol/proj/proj4.js'
  import { Vector as VectorSource, XYZ } from 'ol/source.js'
  import OSM, { ATTRIBUTION } from 'ol/source/OSM'
  import { Fill, Style, Text } from 'ol/style.js'
  import proj4 from 'proj4'
  import { createEventDispatcher } from 'svelte'
  import type { ChangeEventHandler } from 'svelte/elements'
  import type { GetBlockKey } from '.'

  const DEFAULT_ZOOM = 19

  interface Props {
    blocks: EnrichedBlock[]
    selectedArea?: Area | null
    selectedBlock?: InferResultType<'blocks', { geolocation: true }> | null
    heightSubtrahend?: number
    height?: number | string | null
    zoom?: number | null
    showRelief?: boolean
    showBlocks?: boolean
    showAreas?: boolean
    declutter?: boolean
    getBlockKey?: GetBlockKey
    parkingLocations?: Geolocation[]
  }

  let {
    blocks,
    selectedArea = null,
    selectedBlock = null,
    heightSubtrahend = 0,
    height = null,
    zoom = DEFAULT_ZOOM,
    showRelief = $bindable(true),
    showBlocks = true,
    showAreas = true,
    declutter = true,
    getBlockKey = null,
    parkingLocations = [],
  }: Props = $props()

  interface FeatureData {
    label: string
    pathname: string
  }

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

  const dispatch = createEventDispatcher<{ action: OlMap; rendercomplete: void }>()

  let mapElement: HTMLDivElement | null = null
  let map: OlMap | null = null

  const createMap = (element: HTMLDivElement): OlMap => {
    const center = {
      lat: selectedBlock?.geolocation?.lat ?? 0,
      lng: selectedBlock?.geolocation?.long ?? 0,
    }

    const map = new OlMap({
      target: element,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          properties: { isBayerRelief: true },
          opacity: showRelief ? 0.8 : 0,
          source: new XYZ({
            attributions: [
              '© <a href="https://geodaten.bayern.de/" target="_blank">Bayerische Vermessungsverwaltung</a>',
              '© <a href="https://www.eurogeographics.org/" target="_blank">EuroGeographics</a>',
              ATTRIBUTION,
            ],

            urls: ['31', '32', '33', '34', '35', '36', '37', '38', '39', '40'].map(
              (instance) => `https://intergeo${instance}.bayernwolke.de/betty/c_dgm_relief/{z}/{x}/{y}`,
            ),
            projection,
          }),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: DEFAULT_ZOOM,
      }),
    })

    return map
  }

  const findArea = (area: EnrichedArea | null | undefined, type?: EnrichedArea['type']): EnrichedArea[] => {
    const parents = area == null ? [] : [area]
    let current = area

    while (current != null && (type == null ? true : current.type !== type)) {
      current = (current as EnrichedArea).parent as EnrichedArea | null
      current != null && parents.unshift(current)
    }

    return parents
  }

  const createMarker = (block: EnrichedBlock, index: number) => {
    const parents = findArea(block.area as EnrichedArea, 'crag')

    if (block.geolocation?.lat != null && block.geolocation?.long != null) {
      const iconFeature = new Feature({
        data: {
          label: parents.map((parent) => parent.name).join(' / ') + (parents.length === 0 ? '' : ' / ') + block.name,
          pathname: block.pathname,
        } satisfies FeatureData,
        geometry: new Point(fromLonLat([block.geolocation.long, block.geolocation.lat])),
      })

      const iconStyle = new Style({
        text: new Text({
          font: `900 ${block.id === selectedBlock?.id ? 2.25 : 1.875}rem 'Font Awesome 6 Free'`,
          text: '\uf111',
          fill: new Fill({ color: block.id === selectedBlock?.id ? '#60a5fa' : '#ef4444' }),
        }),
        zIndex: showBlocks ? 0 : -1,
      })

      const keyStyle = new Style(
        getBlockKey == null
          ? {}
          : {
              text: new Text({
                fill: new Fill({ color: 'white' }),
                font: '1.5rem system-ui',
                text: String(getBlockKey(block, index)),
              }),
            },
      )

      iconFeature.setStyle([iconStyle, keyStyle])

      return iconFeature
    }
  }

  const createParkingMarker = (parkingLocation: Geolocation) => {
    const iconFeature = new Feature({
      geometry: new Point(fromLonLat([parkingLocation.long, parkingLocation.lat])),
    })

    const iconStyle = new Style({
      text: new Text({
        font: '900 2.25rem "Font Awesome 6 Free"',
        text: '\uf540',
        fill: new Fill({ color: '#1e40af' }),
      }),
    })

    iconFeature.setStyle(iconStyle)

    return iconFeature
  }

  const createSectorLayer = (
    cragBlocks: EnrichedBlock[],
    cragSource: VectorSource<Feature<Geometry>>,
  ): Feature<Point>[] => {
    const allSectors = cragBlocks
      .map((block) => findArea(block.area as EnrichedArea, 'sector').at(0))
      .filter((area) => area?.type === 'sector') as EnrichedArea[]
    const sectorsMap = new Map(allSectors.map((area) => [area.id, area]))
    const sectors = Array.from(sectorsMap.values())

    if (sectors.length === 0) {
      return cragBlocks.map(createMarker).filter((d) => d != null) as Feature<Point>[]
    } else {
      return sectors.flatMap((sector) => {
        const sectorBlocks = cragBlocks.filter(
          (block) => findArea(block.area as EnrichedArea, 'sector').at(0)?.id === sector.id,
        )
        const iconFeatures = sectorBlocks.map(createMarker).filter((d) => d != null) as Feature<Point>[]
        if (iconFeatures.length > 0) {
          const parents = findArea(sector)

          const sectorSource = new VectorSource<Feature<Geometry>>({ features: iconFeatures })
          const extent = sectorSource.getExtent()
          let geometry = fromExtent(extent)
          let area = geometry.getArea()

          if (area < 100) {
            geometry = fromExtent([extent[0] - 10, extent[1] - 10, extent[2] + 10, extent[3] + 10])
            area = geometry.getArea()
          }

          geometry.scale(geometry.getArea() > 1000 ? 1.5 : 3)

          cragSource.addFeature(
            new Feature({
              data: {
                label: parents.map((parent) => parent.name).join(' / '),
                pathname: sector.pathname,
              } satisfies FeatureData,
              geometry,
              text: sector.name,
            }),
          )
        }
        return iconFeatures
      })
    }
  }

  const createCragLayer = (map: OlMap, crag: EnrichedArea) => {
    const cragBlocks = blocks.filter((block) => findArea(block.area as EnrichedArea, 'crag').at(0)?.id === crag.id)
    const vectorSource = new VectorSource<Feature<Geometry>>()

    const iconFeatures = createSectorLayer(cragBlocks, vectorSource)
    vectorSource.addFeatures(iconFeatures)

    if (iconFeatures.length > 0) {
      const parents = findArea(crag)

      const geometry = fromExtent(vectorSource.getExtent())
      geometry.scale(geometry.getArea() > 1000 ? 1.5 : 3)
      vectorSource.addFeature(
        new Feature({
          data: {
            label: parents.map((parent) => parent.name).join(' / '),
            pathname: crag.pathname,
          } satisfies FeatureData,
          geometry,
          text: crag.name,
        }),
      )

      const vectorLayer = new VectorLayer({
        declutter: declutter ? crag.id : false,
        source: vectorSource,

        style: showAreas
          ? {
              'stroke-color': 'rgba(49, 57, 68, 1)',
              'stroke-width': 1,
              'fill-color': 'rgba(255, 255, 255, 0.2)',
              'text-value': ['get', 'text'],
              'text-font': 'bold 14px sans-serif',
              'text-offset-y': -12,
              'text-overflow': true,
            }
          : {
              'stroke-color': 'transparent',
              'fill-color': 'transparent',
            },
      })

      map.addLayer(vectorLayer)
    }
  }

  const createMarkers = (map: OlMap) => {
    const allCrags = blocks
      .map((block) => findArea(block.area as EnrichedArea, 'crag').at(0))
      .filter((d) => d != null) as EnrichedArea[]
    const cragsMap = new Map(allCrags.map((area) => [area.id, area]))
    const crags = Array.from(cragsMap.values())

    crags.forEach((area) => createCragLayer(map, area))

    const parkingIconFeatures = selectedArea == null ? [] : parkingLocations.map(createParkingMarker)
    const vectorSource = new VectorSource<Feature<Geometry>>({ features: parkingIconFeatures })
    const vectorLayer = new VectorLayer({ source: vectorSource })
    map.addLayer(vectorLayer)
  }

  const createPopup = (map: OlMap) => {
    const element = document.createElement('div')
    element.className = 'bg-white rounded p-2 anchor z-10'
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
      if (((event.originalEvent as Event).target as HTMLElement).tagName.toLowerCase() === 'a') {
        return
      }

      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature)
      const data = feature?.get('data') as FeatureData | undefined

      if (data == null) {
        popup.setPosition(undefined)
      } else {
        popup.setPosition(event.coordinate)
        element.innerHTML = `<a class="anchor" href="${data.pathname}">${data.label}</a>`
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

  const centerMap = (map: OlMap) => {
    map.once('rendercomplete', () => {
      const selectedBlocks = blocks.filter((block) => {
        if (selectedBlock?.id === block.id) {
          return true
        }

        if (selectedArea) {
          const parentIds = findArea(block.area as EnrichedArea).map((area) => area.id)
          return parentIds.includes(selectedArea.id)
        }

        return false
      })

      const blocksToDisplay = selectedBlocks.length === 0 ? blocks : selectedBlocks
      const coordinates = blocksToDisplay
        .map((block) =>
          block.geolocation?.lat == null || block.geolocation?.long == null
            ? undefined
            : fromLonLat([block.geolocation.long, block.geolocation.lat]),
        )
        .filter((d) => d != null) as Coordinate[]

      coordinates.push(
        ...parkingLocations.map((parkingLocation) => fromLonLat([parkingLocation.long, parkingLocation.lat])),
      )

      const extent = boundingExtent(coordinates)

      map.getView().fit(extent, { maxZoom: zoom ?? DEFAULT_ZOOM, padding: [250, 250, 250, 250] })

      if (zoom == null) {
        setTimeout(() => {
          map.getView().fit(extent, { maxZoom: 22, padding: [250, 250, 250, 250] })
          dispatch('rendercomplete')
        }, 1000)
      } else {
        dispatch('rendercomplete')
      }
    })
  }

  const mapAction = (el: HTMLDivElement) => {
    mapElement = el
    map = createMap(el)
    createMarkers(map)
    createPopup(map)
    centerMap(map)
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
      } else if (typeof height === 'number') {
        mapElement.style.height = `${height}px`
      } else {
        mapElement.style.height = height
      }
    }

    // map?.invalidateSize()
  }

  const onChangeRelief: ChangeEventHandler<HTMLInputElement> = (event) => {
    showRelief = event.currentTarget.checked

    map
      ?.getAllLayers()
      .find((layer) => layer.get('isBayerRelief'))
      ?.setOpacity(showRelief ? 0.8 : 0)
  }
</script>

<svelte:window onresize={resizeMap} />

<div class="relative">
  <div class="map w-full -z-0" use:mapAction></div>

  <div class="map-controls absolute top-2 right-2 p-2 bg-surface-500/90 text-white">
    <label class="flex items-center space-x-2">
      <input class="checkbox" bind:checked={showRelief} onchange={onChangeRelief} type="checkbox" />
      <p>Show Bayern relief</p>
    </label>
  </div>
</div>

<style>
  @media print {
    .map-controls,
    :global(.ol-zoom),
    :global(.ol-rotate) {
      display: none;
    }
  }
</style>
