<script lang="ts">
  import { page } from '$app/stores'
  import Breadcrumb from '$lib/components/Breadcrumb'
  import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
  import '@fortawesome/fontawesome-free/css/all.css'
  import { AppBar, AppRail, AppRailAnchor, AppShell, storePopup } from '@skeletonlabs/skeleton'
  import '../app.postcss'

  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow })
</script>

<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <strong class="text-xl uppercase">Skeleton</strong>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>

  <svelte:fragment slot="sidebarLeft">
    <AppRail>
      <svelte:fragment slot="lead">
        <AppRailAnchor href="/" selected={$page.url.pathname === '/'}>
          <svelte:fragment slot="lead">
            <i class="fa-solid fa-house" />
          </svelte:fragment>

          Home
        </AppRailAnchor>
      </svelte:fragment>

      <AppRailAnchor href="/areas" selected={$page.url.pathname.startsWith('/areas')}>
        <svelte:fragment slot="lead">
          <i class="fa-solid fa-layer-group" />
        </svelte:fragment>

        Areas
      </AppRailAnchor>

      <AppRailAnchor href="/ascents" selected={$page.url.pathname.startsWith('/ascents')}>
        <svelte:fragment slot="lead">
          <i class="fa-solid fa-check-double" />
        </svelte:fragment>

        Ascents
      </AppRailAnchor>
    </AppRail>
  </svelte:fragment>
  <!-- Page Route Content -->

  <div class="p-4">
    <Breadcrumb url={$page.url} />

    <slot />
  </div>
</AppShell>
