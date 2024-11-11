<script lang="ts">
  import vegaEmbed, { type EmbedOptions, type VisualizationSpec } from 'vega-embed'

  interface Props {
    spec: VisualizationSpec
    opts?: EmbedOptions
  }

  let { spec, opts = {} }: Props = $props()

  const action = (el: HTMLDivElement) => {
    vegaEmbed(el, spec, opts)
  }
</script>

<div class="vega-container w-full" use:action></div>
