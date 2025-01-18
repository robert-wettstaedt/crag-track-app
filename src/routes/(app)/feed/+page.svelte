<script lang="ts">
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import ActivityFeed from '$lib/components/ActivityFeed'
  import AppBar from '$lib/components/AppBar'

  const { data } = $props()
</script>

<svelte:head>
  <title>Feed - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Feed
  {/snippet}
</AppBar>

<div class="mt-8">
  <ActivityFeed activities={data.feed.activities} pagination={data.feed.pagination} withBreadcrumbs />
</div>
