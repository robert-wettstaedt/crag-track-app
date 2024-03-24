<script lang="ts">
  import type { InferResultType } from '$lib/db/types'

  export let crag: InferResultType<'crags', { parentArea: true }>

  const areaSlugs = [] as string[]

  const recursive = (area: InferResultType<'areas', { parentArea: true }>) => {
    areaSlugs.push(area.slug)

    if (area.parent != null) {
      recursive(area.parentArea as InferResultType<'areas', { parentArea: true }>)
    }
  }

  recursive(crag.parentArea as InferResultType<'areas', { parentArea: true }>)

  $: basePath = `/areas/${areaSlugs.join('/')}/_/crags/${crag.slug}`
</script>

<div style="width:100%;text-align:center;font-weight:600">
  <a class="anchor" href={basePath}>{crag.name}</a>
</div>
