<script lang="ts">
  import type { EnrichedCrag } from '$lib/db/utils'

  export let crag: EnrichedCrag
</script>

<div style="width:100%;text-align:center;font-weight:600">
  <a class="anchor" href={'/' + crag.pathname}>{crag.name}</a>
</div>
