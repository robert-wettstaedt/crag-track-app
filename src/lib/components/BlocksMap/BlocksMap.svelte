<script lang="ts">
  import type { Area, Block, Geolocation } from '$lib/db/schema'
  import type { NestedArea } from '$lib/db/types'
  import Feature from 'ol/Feature.js'
  import OlMap from 'ol/Map.js'
  import Overlay from 'ol/Overlay.js'
  import View from 'ol/View.js'
  import { Attribution, FullScreen, defaults as defaultControls } from 'ol/control.js'
  import { boundingExtent } from 'ol/extent'
  import { Geometry } from 'ol/geom'
  import Point from 'ol/geom/Point.js'
  import { fromExtent } from 'ol/geom/Polygon'
  import { DragRotateAndZoom, defaults as defaultInteractions } from 'ol/interaction.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import 'ol/ol.css'
  import { fromLonLat } from 'ol/proj.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import OSM, { ATTRIBUTION } from 'ol/source/OSM'
  import TileWMS from 'ol/source/TileWMS.js'
  import { Fill, Style, Text } from 'ol/style.js'
  import { createEventDispatcher } from 'svelte'
  import type { GetBlockKey, NestedBlock } from '.'
  import Layers, { type Layer } from './Layers'

  const DEFAULT_ZOOM = 19

  interface Props {
    collapsibleAttribution?: boolean
    blocks: NestedBlock[]
    selectedArea?: Area | null
    selectedBlock?: Block | null
    heightSubtrahend?: number
    height?: number | string | null
    zoom?: number | null
    showRelief?: boolean
    showBlocks?: boolean
    showAreas?: boolean
    declutter?: boolean
    getBlockKey?: GetBlockKey
    paddingBottom?: number
    parkingLocations?: Geolocation[]
  }

  let {
    collapsibleAttribution = true,
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
    paddingBottom = 32,
  }: Props = $props()

  interface FeatureData {
    label: string
    pathname: string
    priority: number
  }

  const dispatch = createEventDispatcher<{ action: OlMap; rendercomplete: void }>()

  let mapElement: HTMLDivElement | null = null
  let map: OlMap | null = null

  let layersIsVisible = $state(false)
  const layers: Layer[] = [
    { label: 'OSM', name: 'osm' },
    { label: 'Bayern Relief', name: 'bayern_relief' },
    { label: 'Markers', name: 'markers' },
  ]

  const isRootMap = showAreas && selectedArea == null && showBlocks && selectedBlock == null

  const createMap = (element: HTMLDivElement): OlMap => {
    const map = new OlMap({
      controls: defaultControls({ attribution: false }).extend([
        new FullScreen(),
        new Attribution({ collapsible: collapsibleAttribution }),
      ]),
      interactions: defaultInteractions({ doubleClickZoom: true }).extend([new DragRotateAndZoom()]),
      target: element,
      layers: [
        new TileLayer({
          properties: { layerOpts: layers.find((layer) => layer.name === 'osm') },
          source: new OSM(),
        }),
        new TileLayer(
          showRelief
            ? {
                properties: { layerOpts: layers.find((layer) => layer.name === 'bayern_relief') },
                source: new TileWMS({
                  attributions: [
                    '© <a href="https://geodaten.bayern.de/" target="_blank">Bayerische Vermessungsverwaltung</a>',
                    '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie (2022)</a>',
                    '<a href="https://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>',
                    ATTRIBUTION,
                  ],
                  url: 'https://geoservices.bayern.de/od/wms/dgm/v1/relief',
                  params: {
                    LAYERS: 'by_relief_schraeglicht',
                  },
                }),
                minZoom: 14,
                opacity: 0.7,
              }
            : {},
        ),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: DEFAULT_ZOOM,
        constrainResolution: true,
      }),
    })

    return map
  }

  const findArea = (area: NestedArea | null | undefined, type?: Area['type']): NestedArea[] => {
    const parents = area == null ? [] : [area]
    let current = area

    while (current != null && (type == null ? true : current.type !== type)) {
      current = current.parent as NestedArea | null
      current != null && parents.unshift(current)
    }

    return parents
  }

  const createMarker = (block: (typeof blocks)[0], index: number) => {
    const parents = findArea(block.area, 'crag')

    if (block.geolocation?.lat != null && block.geolocation?.long != null) {
      const iconFeature = new Feature({
        data: {
          label: parents.map((parent) => parent.name).join(' / ') + (parents.length === 0 ? '' : ' / ') + block.name,
          pathname: `/blocks/${block.id}`,
          priority: 1,
        } satisfies FeatureData,
        geometry: new Point(fromLonLat([block.geolocation.long, block.geolocation.lat])),
      })

      const iconStyle = new Style({
        text: new Text({
          font: `400 ${block.id === selectedBlock?.id ? 2.25 : 1.875}rem 'Font Awesome 6 Free'`,
          text: '\uf111',
          fill: new Fill({ color: block.id === selectedBlock?.id ? '#60a5fa' : '#ef4444' }),
        }),
        zIndex: showBlocks ? 0 : -1,
      })

      const backgroundStyle = new Style({
        text: new Text({
          font: `900 ${block.id === selectedBlock?.id ? 2.25 : 1.875}rem 'Font Awesome 6 Free'`,
          text: '\uf111',
          fill: new Fill({ color: getBlockKey == null ? '#ffffff00' : '#ffffff88' }),
        }),
        zIndex: showBlocks ? 0 : -1,
      })

      const keyStyle = new Style(
        getBlockKey == null
          ? {}
          : {
              text: new Text({
                fill: new Fill({ color: '#ef4444' }),
                font: '1.5rem system-ui',
                text: String(getBlockKey(block, index)),
              }),
            },
      )

      iconFeature.setStyle([iconStyle, backgroundStyle, keyStyle])

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
    cragBlocks: NestedBlock[],
    cragSource: VectorSource<Feature<Geometry>>,
  ): Feature<Point>[] => {
    const allSectors = cragBlocks
      .map((block) => findArea(block.area, 'sector').at(0))
      .filter((area) => area?.type === 'sector') as NestedBlock['area'][]
    const sectorsMap = new Map(allSectors.map((area) => [area.id, area]))
    const sectors = Array.from(sectorsMap.values())

    if (sectors.length === 0) {
      return cragBlocks.map(createMarker).filter((d) => d != null) as Feature<Point>[]
    } else {
      return sectors.flatMap((sector) => {
        const sectorBlocks = cragBlocks.filter((block) => findArea(block.area, 'sector').at(0)?.id === sector.id)
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
                pathname: `/areas/${sector.id}`,
                priority: 2,
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

  const createCragLayer = (map: OlMap, crag: NestedBlock['area']) => {
    const cragBlocks = blocks.filter((block) => findArea(block.area, 'crag').at(0)?.id === crag.id)
    const vectorSource = new VectorSource<Feature<Geometry>>()

    const iconFeatures = createSectorLayer(cragBlocks, vectorSource)
    vectorSource.addFeatures(iconFeatures)

    if (iconFeatures.length > 0) {
      const geometry = fromExtent(vectorSource.getExtent())
      geometry.scale(geometry.getArea() > 1000 ? 1.5 : 3)
      vectorSource.addFeature(
        new Feature({
          geometry,
          text: crag.name,
        }),
      )

      const vectorLayer = new VectorLayer({
        properties: { layerOpts: layers.find((layer) => layer.name === 'markers') },
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
      .map((block) => findArea(block.area, 'crag').at(0))
      .filter((d) => d != null) as NestedBlock['area'][]
    const cragsMap = new Map(allCrags.map((area) => [area.id, area]))
    const crags = Array.from(cragsMap.values())

    crags.forEach((area) => createCragLayer(map, area))

    const parkingIconFeatures = selectedArea == null ? [] : parkingLocations.map(createParkingMarker)
    const vectorSource = new VectorSource<Feature<Geometry>>({ features: parkingIconFeatures })
    const vectorLayer = new VectorLayer({
      properties: { layerOpts: layers.find((layer) => layer.name === 'markers') },
      source: vectorSource,
    })
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

      const features = map
        .getFeaturesAtPixel(event.pixel)
        .filter((feature) => feature.get('data')?.priority != null)
        .toSorted((a, b) => Number(a.get('data')?.priority) - Number(b.get('data')?.priority))
      const feature = features.at(0)
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
      const features = map.getFeaturesAtPixel(pixel)
      const hit = features.some((feature) => feature.get('data')?.priority != null)

      target.style.cursor = hit ? 'pointer' : ''
    })

    map.on('movestart', () => popup.setPosition(undefined))
  }

  const centerMap = (map: OlMap) => {
    map.once('rendercomplete', () => {
      resizeMap()

      const selectedBlocks = blocks.filter((block) => {
        if (selectedBlock?.id === block.id) {
          return true
        }

        if (selectedArea) {
          const parentIds = findArea(block.area).map((area) => area.id)
          return parentIds.includes(selectedArea.id)
        }

        return false
      })

      const blocksToDisplay = selectedBlocks.length === 0 ? blocks : selectedBlocks
      const coordinates = blocksToDisplay
        .filter((block) => block.geolocation?.lat != null && block.geolocation!.long != null)
        .map((block) => fromLonLat([block.geolocation!.long, block.geolocation!.lat]))

      coordinates.push(
        ...parkingLocations.map((parkingLocation) => fromLonLat([parkingLocation.long, parkingLocation.lat])),
      )

      if (isRootMap) {
        const sorted = coordinates.toSorted((a, b) => {
          return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
        })
        const median = sorted[Math.floor(sorted.length / 2)]

        const filtered = coordinates.filter((coordinate) => {
          const distance = Math.sqrt(Math.pow(coordinate[0] - median[0], 2) + Math.pow(coordinate[1] - median[1], 2))
          return distance < 200_000
        })

        const extent = boundingExtent(filtered)

        map.getView().fit(extent, {
          callback: () => dispatch('rendercomplete'),
          maxZoom: zoom ?? DEFAULT_ZOOM,
        })
      } else {
        const extent = boundingExtent(coordinates)

        map.getView().fit(extent, {
          callback: () => dispatch('rendercomplete'),
          maxZoom: zoom ?? DEFAULT_ZOOM,
        })
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

    const observer = new ResizeObserver(() => requestAnimationFrame(resizeMap))
    observer.observe(el)

    dispatch('action', map)

    return {
      destroy: () => {
        // map?.remove()
        mapElement = null
        map = null
        observer.disconnect()
      },
    }
  }

  function resizeMap() {
    if (mapElement != null) {
      if (height == null) {
        const bcr = mapElement.parentElement?.getBoundingClientRect()

        if (bcr != null) {
          mapElement.style.height = `${bcr.height}px`
        }
      } else if (typeof height === 'number') {
        mapElement.style.height = `${height}px`
      } else {
        mapElement.style.height = height
      }
    }
  }

  const onChangeRelief = (layers: string[]) => {
    map
      ?.getAllLayers()
      .filter((layer) => layer.get('layerOpts') != null)
      .map((layer) => {
        const opts = layer.get('layerOpts')
        const isVisible = layers.includes(opts.name)
        layer.setVisible(isVisible)
      })
  }
</script>

<div class="relative flex h-full">
  <!-- svelte-ignore a11y_positive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="map w-full -z-0" tabindex="1" use:mapAction>
    <div class="relative z-10 {'ontouchstart' in window ? ' ol-touch' : ''}">
      <div class="ol-control ol-layers">
        <button
          aria-label="Map layers"
          onclick={() => (layersIsVisible = !layersIsVisible)}
          title="Map layers"
          type="button"
        >
          <i class="fa-solid fa-layer-group text-sm {layersIsVisible ? 'text-primary-500' : ''}"></i>
        </button>

        {#if layersIsVisible}
          <Layers {layers} onChange={onChangeRelief} />
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  :root {
    --ol-control-height: 1.375em;
    --ol-control-margin: 0.5em;

    @media (pointer: coarse) {
      --ol-control-height: 2em;
    }
  }

  :global(.ol-zoom) {
    left: initial;
    right: var(--ol-control-margin);
    top: var(--ol-control-margin);
  }

  :global(.ol-full-screen) {
    left: initial;
    right: var(--ol-control-margin);
    top: calc(
      var(--ol-control-margin) + var(--ol-control-height) + var(--ol-control-height) + var(--ol-control-margin)
    );
  }

  :global(.ol-rotate) {
    left: initial;
    right: var(--ol-control-margin);
    top: calc(
      var(--ol-control-margin) + var(--ol-control-height) + var(--ol-control-height) + var(--ol-control-margin) +
        var(--ol-control-height) + var(--ol-control-margin)
    );
    opacity: 1 !important;
    visibility: visible !important;
  }

  .ol-layers {
    right: var(--ol-control-margin);
    top: calc(
      var(--ol-control-margin) + var(--ol-control-height) + var(--ol-control-height) + var(--ol-control-margin) +
        var(--ol-control-height) + var(--ol-control-margin) + var(--ol-control-height) + var(--ol-control-margin)
    );
  }

  @media print {
    .ol-layers,
    :global(.ol-zoom),
    :global(.ol-full-screen),
    :global(.ol-rotate) {
      display: none;
    }
  }
</style>
