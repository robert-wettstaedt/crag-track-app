<script lang="ts">
  import { afterNavigate, invalidate, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import Logo from '$lib/assets/logo.png'
  import Breadcrumb from '$lib/components/Breadcrumb'
  import NavTiles from '$lib/components/NavTiles'
  import '@fortawesome/fontawesome-free/css/all.css'
  import { ProgressBar } from '@prgm/sveltekit-progress-bar'
  import { AppBar, Navigation, Popover, Switch } from '@skeletonlabs/skeleton-svelte'
  import { onMount } from 'svelte'
  import '../../app.postcss'

  let { data, form, children } = $props()
  let pageEl: HTMLDivElement

  onMount(() => {
    const value = data.supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== data.session?.expires_at) {
        invalidate('supabase:auth')
      }
    })

    return () => value.data.subscription.unsubscribe()
  })

  afterNavigate(() => {
    if ($page.url.hash == null) {
      pageEl?.scrollTo(0, 0)
    }
  })

  $effect(() => {
    if (form != null) {
      pageEl?.scrollTo(0, 0)
    }
  })
</script>

<svelte:head>
  <title>{PUBLIC_APPLICATION_NAME}</title>
  <meta property="og:title" content={PUBLIC_APPLICATION_NAME} />
  <meta property="og:description" content="Secure boulder topo and session tracker." />
  <meta property="og:image" content={Logo} />
  <meta property="og:url" content={$page.url.toString()} />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
  <ProgressBar class="text-secondary-500" />

  <AppBar>
    {#snippet lead()}
      <a class="flex gap-2" href="/">
        <img src={Logo} alt={PUBLIC_APPLICATION_NAME} width={32} height={32} />

        <strong class="text-xl">{PUBLIC_APPLICATION_NAME}</strong>
      </a>
    {/snippet}

    {#snippet trail()}
      {#if $page.data.session?.user == null}
        <a href="/auth" class="btn btn-sm preset-filled-primary-500"> Get Started </a>
      {:else}
        <Popover
          arrow
          arrowBackground="!bg-surface-200 dark:!bg-surface-800"
          contentBase="card bg-surface-200-800 p-2 md:p-4 w-74 shadow-xl"
          positioning={{ placement: 'bottom' }}
          positionerZIndex="!z-[100]"
        >
          {#snippet trigger()}
            <i class="fa-solid fa-circle-user text-3xl"></i>
          {/snippet}

          {#snippet content()}
            <div class="mb-4">
              Hi, {data.user?.username}
            </div>

            <nav class="list-nav">
              <div class="flex items-center p-2">
                Grading scale:

                <span class="mx-2">FB</span>

                <Switch
                  checked={data.user?.userSettings?.gradingScale === 'V'}
                  name="gradingScale"
                  onCheckedChange={async (event) => {
                    const response = await fetch(`/api/users/settings?gradingScale=${event.checked ? 'V' : 'FB'}`, {
                      method: 'POST',
                    })

                    if (response.ok) {
                      invalidateAll()
                    }
                  }}
                />

                <span class="mx-2">V</span>
              </div>

              <ul>
                <li>
                  <a class="flex hover:preset-filled-primary-100-900 p-2" href={`/users/${data.user?.username}`}>
                    Profile
                  </a>
                </li>

                <li>
                  <button
                    class="flex p-2 w-full hover:preset-filled-primary-100-900"
                    onclick={() => data.supabase.auth.signOut()}
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </nav>

            <div class="arrow bg-surface-100-800-token"></div>
          {/snippet}
        </Popover>
      {/if}
    {/snippet}
  </AppBar>

  <div
    bind:this={pageEl}
    class="relative p-2 md:p-4 overflow-y-auto {$page.data.session?.user == null ? '' : 'md:ms-[96px]'}"
  >
    <Breadcrumb url={$page.url} />

    {@render children?.()}
  </div>

  {#if data.userPermissions?.includes('data.read')}
    <Navigation.Bar classes="md:hidden">
      <NavTiles userPermissions={data.userPermissions} />
    </Navigation.Bar>

    <Navigation.Rail base="hidden md:block fixed top-[68px] h-screen">
      {#snippet header()}
        <Navigation.Tile href="/" label="Home">
          <i class="fa-solid fa-house"></i>
        </Navigation.Tile>
      {/snippet}

      {#snippet tiles()}
        <NavTiles userPermissions={data.userPermissions} />
      {/snippet}
    </Navigation.Rail>
  {/if}
</div>
