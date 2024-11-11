<script lang="ts">
  let { data } = $props();
</script>

{#await import('$lib/components/BlocksMap') then BlocksMap}
  <BlocksMap.default blocks={data.blocks} />
{/await}
