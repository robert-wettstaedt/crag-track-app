<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import Logo from '$lib/assets/logo.png'
  import Breadcrumb from '$lib/components/Breadcrumb'
  import { SignIn, SignOut } from '@auth/sveltekit/components'
  import '@fortawesome/fontawesome-free/css/all.css'
  import { AppBar, Nav, Popover, Switch } from '@skeletonlabs/skeleton-svelte'
  import '../../app.postcss'

  let { data, children } = $props()
</script>

<svelte:head>
  <title>Crag Track</title>
</svelte:head>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
  <AppBar>
    {#snippet lead()}
      <a class="flex items-center gap-2" href="/">
        <img src={Logo} alt="Crag Track" width={32} height={32} />

        <strong class="text-xl uppercase">Crag Track</strong>
      </a>
    {/snippet}

    {#snippet trail()}
      {#if $page.data.session?.user == null}
        <SignIn>
          {#snippet submitButton()}
            <div class="buttonPrimary">Sign in</div>
          {/snippet}
        </SignIn>
      {:else}
        <Popover
          arrow
          arrowBackground="!bg-surface-200 dark:!bg-surface-800"
          contentBase="card bg-surface-200-800 p-4 w-74 shadow-xl"
          positioning={{ placement: 'bottom' }}
        >
          {#snippet trigger()}
            <i class="fa-solid fa-circle-user text-3xl"></i>
          {/snippet}

          {#snippet content()}
            <div class="mb-4">
              Hi, {data.user?.userName}
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
                  <a class="flex hover:preset-filled-primary-100-900 p-2" href={`/users/${data.user?.userName}`}>
                    Profile
                  </a>
                </li>

                {#if !PUBLIC_DEMO_MODE}
                  <li>
                    <SignOut
                      class="flex [&>button]:flex [&>button]:p-2 [&>button]:w-full hover:[&>button]:preset-filled-primary-100-900"
                    >
                      {#snippet submitButton()}
                        <span>Sign out</span>
                      {/snippet}
                    </SignOut>
                  </li>
                {/if}
              </ul>
            </nav>

            <div class="arrow bg-surface-100-800-token"></div>
          {/snippet}
        </Popover>
      {/if}
    {/snippet}
  </AppBar>

  <Nav.Rail base="fixed top-[68px] h-screen">
    {#snippet header()}
      <Nav.Tile href="/" label="Home">
        <i class="fa-solid fa-house"></i>
      </Nav.Tile>
    {/snippet}

    {#snippet tiles()}
      <Nav.Tile href="/areas" label="Areas">
        <i class="fa-solid fa-layer-group"></i>
      </Nav.Tile>

      <Nav.Tile href="/ascents" label="Ascents">
        <i class="fa-solid fa-check-double"></i>
      </Nav.Tile>

      <Nav.Tile href="/routes" label="Routes">
        <i class="fa-solid fa-route"></i>
      </Nav.Tile>

      <Nav.Tile href="/search" label="Search">
        <i class="fa-solid fa-search"></i>
      </Nav.Tile>

      <Nav.Tile href="/tags" label="Tags">
        <i class="fa-solid fa-tags"></i>
      </Nav.Tile>
    {/snippet}
  </Nav.Rail>

  <div class="relative ms-[96px] p-4 overflow-y-auto">
    <Breadcrumb url={$page.url} />

    {@render children?.()}
  </div>
</div>
