<script module lang="ts">
  export interface VegaProps {
    spec: VisualizationSpec
    opts?: EmbedOptions
    onEmbed?: (result: Result) => void
  }
</script>

<script lang="ts">
  import { type EmbedOptions, type Result, type VisualizationSpec } from 'vega-embed'

  let { spec, onEmbed, opts = {} }: VegaProps = $props()

  const action = (el: HTMLDivElement) => {
    import('vega-embed').then(async (module) => {
      const result = await module.default(el, spec, opts)
      onEmbed?.(result)
    })
  }
</script>

<div class="vega-container w-full" use:action></div>
