<script lang="ts">
  import { page } from '$app/stores'
  import { Navigation } from '@skeletonlabs/skeleton-svelte'

  interface Props {
    userPermissions: App.Locals['userPermissions'] | undefined
  }

  let { userPermissions }: Props = $props()
</script>

<Navigation.Tile href="/areas" label="Areas" selected={$page.url.pathname.startsWith('/areas')}>
  <i class="fa-solid fa-layer-group"></i>
</Navigation.Tile>

<Navigation.Tile href="/ascents" label="Ascents" selected={$page.url.pathname.startsWith('/ascents')}>
  <i class="fa-solid fa-check-double"></i>
</Navigation.Tile>

<Navigation.Tile href="/routes" label="Routes" selected={$page.url.pathname.startsWith('/routes')}>
  <i class="fa-solid fa-route"></i>
</Navigation.Tile>

<Navigation.Tile href="/search" label="Search" selected={$page.url.pathname.startsWith('/search')}>
  <i class="fa-solid fa-search"></i>
</Navigation.Tile>

{#if userPermissions?.includes('data.edit')}
  <Navigation.Tile href="/tags" label="Tags" selected={$page.url.pathname.startsWith('/tags')}>
    <i class="fa-solid fa-tags"></i>
  </Navigation.Tile>
{/if}
