<script lang="ts">
  import { type EmbedOptions, type VisualizationSpec } from 'vega-embed'

  interface Props {
    spec: VisualizationSpec
    opts?: EmbedOptions
  }

  let { spec, opts = {} }: Props = $props()

  const action = (el: HTMLDivElement) => {
    import('vega-embed').then((module) => module.default(el, spec, opts))
  }
</script>

<div class="vega-container w-full" use:action></div>
