<script lang="ts">
  import AscentsTable from '$lib/components/AscentsTable'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <br />
  </svelte:fragment>

  Ascents
</AppBar>

<AscentsTable ascents={data.ascents} />
