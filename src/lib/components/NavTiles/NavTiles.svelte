<script>
  import { page } from '$app/stores'
  import { Nav } from '@skeletonlabs/skeleton-svelte'
</script>

<Nav.Tile href="/areas" label="Areas" selected={$page.url.pathname.startsWith('/areas')}>
  <i class="fa-solid fa-layer-group"></i>
</Nav.Tile>

<Nav.Tile href="/ascents" label="Ascents" selected={$page.url.pathname.startsWith('/ascents')}>
  <i class="fa-solid fa-check-double"></i>
</Nav.Tile>

<Nav.Tile href="/routes" label="Routes" selected={$page.url.pathname.startsWith('/routes')}>
  <i class="fa-solid fa-route"></i>
</Nav.Tile>

<Nav.Tile href="/search" label="Search" selected={$page.url.pathname.startsWith('/search')}>
  <i class="fa-solid fa-search"></i>
</Nav.Tile>

<Nav.Tile href="/tags" label="Tags" selected={$page.url.pathname.startsWith('/tags')}>
  <i class="fa-solid fa-tags"></i>
</Nav.Tile>
