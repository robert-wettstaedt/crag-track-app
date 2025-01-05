<script lang="ts">
  import type { GetBlockKey } from '$lib/components/BlocksMap'
  import BlockEntry, { type Block } from './components/BlockEntry'

  interface Props {
    name: string
    blocks: Block[]
    getBlockKey?: GetBlockKey
    onLoadTopo?: () => void
  }

  let { name, blocks, getBlockKey = null, onLoadTopo }: Props = $props()
</script>

<section>
  <h2 class="p-2 text-center text-xl">{name}</h2>

  {#await import('$lib/components/BlocksMap') then BlocksMap}
    <BlocksMap.default
      {blocks}
      {getBlockKey}
      collapsibleAttribution={false}
      declutter={false}
      height="210mm"
      on:rendercomplete
      showAreas={false}
      zoom={null}
    />
  {/await}
</section>

{#each blocks as block, index}
  <BlockEntry {block} {index} {getBlockKey} {onLoadTopo} />
{/each}

<style>
  section {
    break-after: page;
    height: 210mm;
    width: 297mm;
  }
</style>
