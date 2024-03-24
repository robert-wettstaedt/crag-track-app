<script lang="ts">
  import type { InferResultType } from '$lib/db/types'
  import type { EnrichedCrag } from '$lib/db/utils'

  export let crag: EnrichedCrag

  const areaSlugs = [] as string[]

  const recursive = (area: InferResultType<'areas', { parentArea: true }>) => {
    areaSlugs.push(area.slug)

    if (area.parent != null) {
      recursive(area.parentArea as InferResultType<'areas', { parentArea: true }>)
    }
  }

  recursive(crag.parentArea as InferResultType<'areas', { parentArea: true }>)
</script>

<div style="width:100%;text-align:center;font-weight:600">
  <a class="anchor" href={crag.pathname}>{crag.name}</a>
</div>
