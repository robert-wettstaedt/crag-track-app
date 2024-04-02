<script lang="ts">
  import vegaEmbed, { type EmbedOptions, type VisualizationSpec } from 'vega-embed'

  export let spec: VisualizationSpec
  export let opts: EmbedOptions = {}

  const action = (el: HTMLDivElement) => {
    vegaEmbed(el, spec, opts)
  }
</script>

<div class="vega-container w-full" use:action />
