<script lang="ts">
  export let data
</script>

{#await import('$lib/components/CragMap') then CragMap}
  <CragMap.default crags={data.crags} />
{/await}
