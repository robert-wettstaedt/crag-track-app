<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import Breadcrumb from '$lib/components/Breadcrumb'
  import { SignIn, SignOut } from '@auth/sveltekit/components'
  import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
  import '@fortawesome/fontawesome-free/css/all.css'
  import {
    AppBar,
    AppRail,
    AppRailAnchor,
    AppShell,
    Modal,
    SlideToggle,
    initializeStores,
    popup,
    storePopup,
  } from '@skeletonlabs/skeleton'
  import '../../app.postcss'

  export let data

  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow })
  initializeStores()
</script>

<svelte:head>
  <title>Crag Track</title>
</svelte:head>

<Modal />

<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <strong class="text-xl uppercase">Crag Track</strong>
      </svelte:fragment>

      <svelte:fragment slot="trail">
        {#if $page.data.session?.user == null}
          <SignIn>
            <div slot="submitButton" class="buttonPrimary">Sign in</div>
          </SignIn>
        {:else}
          <i
            class="fa-solid fa-circle-user text-3xl"
            use:popup={{ event: 'click', target: 'popup-user', placement: 'bottom-end' }}
          />

          <div class="card p-4 w-72 shadow-xl" data-popup="popup-user">
            <div class="mb-4">
              Hi, {data.user?.userName}
            </div>

            <nav class="list-nav">
              <ul>
                <li>
                  <a href={`/users/${data.user?.userName}`}>Profile</a>
                </li>

                {#if !PUBLIC_DEMO_MODE}
                  <li class="list-item-sign-out">
                    <SignOut>
                      <span slot="submitButton">Sign out</span>
                    </SignOut>
                  </li>
                {/if}
              </ul>

              <div class="flex items-center px-4">
                Grading scale:

                <span class="mx-2">FB</span>

                <SlideToggle
                  checked={data.user?.userSettings?.gradingScale === 'V'}
                  name="gradingScale"
                  on:change={async (event) => {
                    const response = await fetch(
                      `/api/users/settings?gradingScale=${event.target?.checked ? 'V' : 'FB'}`,
                      { method: 'POST' },
                    )

                    if (response.ok) {
                      invalidateAll()
                    }
                  }}
                  size="sm"
                />

                <span class="mx-2">V</span>
              </div>
            </nav>

            <div class="arrow bg-surface-100-800-token" />
          </div>
        {/if}
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

      <AppRailAnchor href="/routes" selected={$page.url.pathname.startsWith('/routes')}>
        <svelte:fragment slot="lead">
          <i class="fa-solid fa-route" />
        </svelte:fragment>

        Routes
      </AppRailAnchor>

      <AppRailAnchor href="/search" selected={$page.url.pathname.startsWith('/search')}>
        <svelte:fragment slot="lead">
          <i class="fa-solid fa-search" />
        </svelte:fragment>

        Search
      </AppRailAnchor>

      <AppRailAnchor href="/tags" selected={$page.url.pathname.startsWith('/tags')}>
        <svelte:fragment slot="lead">
          <i class="fa-solid fa-tags" />
        </svelte:fragment>

        Tags
      </AppRailAnchor>
    </AppRail>
  </svelte:fragment>
  <!-- Page Route Content -->

  <div class="p-4">
    <Breadcrumb url={$page.url} />

    <slot />
  </div>
</AppShell>
