<script lang="ts">
  export let data
</script>

{#await import('$lib/components/BlocksMap') then BlocksMap}
  <BlocksMap.default blocks={data.blocks} />
{/await}
