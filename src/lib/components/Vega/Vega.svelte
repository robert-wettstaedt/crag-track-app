<script module lang="ts">
  export interface VegaProps {
    spec: VisualizationSpec
    opts?: EmbedOptions
  }
</script>

<script lang="ts">
  import { type EmbedOptions, type VisualizationSpec } from 'vega-embed'

  let { spec, opts = {} }: VegaProps = $props()

  const action = (el: HTMLDivElement) => {
    import('vega-embed').then((module) => module.default(el, spec, opts))
  }
</script>

<div class="vega-container w-full" use:action></div>
