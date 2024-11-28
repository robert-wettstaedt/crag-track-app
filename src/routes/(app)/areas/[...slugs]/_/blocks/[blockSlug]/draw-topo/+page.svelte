<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import TopoViewer, { highlightedRouteStore, selectedRouteStore } from '$lib/components/TopoViewer'
  import { convertPointsToPath, type TopoDTO, type TopoRouteDTO } from '$lib/topo'
  import { AppBar, Popover } from '@skeletonlabs/skeleton-svelte'

  let { form, data } = $props()

  // https://github.com/sveltejs/kit/issues/12999
  let topos = $state(data.topos)
  $effect(() => {
    topos = data.topos
  })

  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let dirtyRoutes: number[] = $state([])
  let selectedTopoIndex = $state(0)

  const onChangeTopo = (value: TopoDTO[], changedRoute: TopoRouteDTO) => {
    if (changedRoute.routeFk != null) {
      dirtyRoutes = Array.from(new Set([...dirtyRoutes, changedRoute.routeFk]))
    }
  }
</script>

<svelte:head>
  <title>Draw topo of {data.block.name} - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Draw topo of</span>
    <a class="anchor" href={basePath}>{data.block.name}</a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<div class="mt-8 flex">
  <section class="p-2 md:p-4 w-2/3">
    <TopoViewer editable={true} bind:selectedTopoIndex bind:topos onChange={onChangeTopo} />
  </section>

  <section class="p-2 md:p-4 w-1/3">
    <div class="card preset-filled-surface-100-900 p-2 md:p-4 h-full flex flex-col justify-between">
      <nav class="list-nav">
        <ul>
          {#each data.block.routes as route}
            <li
              class={`px-4 py-2 ${
                [$selectedRouteStore, $highlightedRouteStore].includes(route.id) ? 'preset-filled-primary-100-900' : ''
              }`}
            >
              {#if route.hasTopo}
                <span
                  class={`text-primary-500 list-option w-full flex justify-between cursor-pointer ${
                    [$selectedRouteStore, $highlightedRouteStore].includes(route.id) ? 'text-white' : ''
                  }`}
                  onmouseenter={() => highlightedRouteStore.set(route.id)}
                  onmouseleave={() => highlightedRouteStore.set(null)}
                  onclick={() => selectedRouteStore.set(route.id)}
                  onkeydown={(event) => event.key === 'Enter' && selectedRouteStore.set(route.id)}
                  role="presentation"
                >
                  <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} {route} />

                  {#if dirtyRoutes.includes(route.id)}
                    <form
                      method="POST"
                      action="?/saveRoute"
                      use:enhance={() => {
                        return async ({ result, update }) => {
                          if (result?.error == null) {
                            dirtyRoutes = dirtyRoutes.filter((routeId) => routeId !== route.id)
                          }

                          return update()
                        }
                      }}
                    >
                      <input hidden name="routeFk" value={form?.routeFk ?? route.id} />
                      <input hidden name="topoFk" value={form?.topoFk ?? topos[selectedTopoIndex].id} />
                      <input
                        hidden
                        name="id"
                        value={form?.id ??
                          topos.flatMap((topo) => topo.routes).find((topoRoute) => topoRoute.routeFk === route.id)?.id}
                      />
                      <input
                        hidden
                        name="topType"
                        value={form?.topType ??
                          topos.flatMap((topo) => topo.routes).find((topoRoute) => topoRoute.routeFk === route.id)
                            ?.topType}
                      />
                      <input
                        hidden
                        name="path"
                        value={form?.path ??
                          convertPointsToPath(
                            topos.flatMap((topo) => topo.routes).find((topoRoute) => topoRoute.routeFk === route.id)
                              ?.points ?? [],
                          )}
                      />

                      <button class="btn btn-sm variant-soft-primary" type="submit">Save</button>
                    </form>
                  {:else if [$selectedRouteStore].includes(route.id)}
                    <Popover
                      arrow
                      arrowBackground="!bg-surface-200 dark:!bg-surface-800"
                      contentBase="card bg-surface-200-800 p-2 md:p-4 space-y-4 max-w-[320px]"
                      positioning={{ placement: 'top' }}
                      triggerBase="btn btn-sm preset-filled-error-500 !text-white"
                    >
                      {#snippet trigger()}
                        <i class="fa-solid fa-trash"></i>
                      {/snippet}

                      {#snippet content()}
                        <article>
                          <p>Are you sure you want to delete this route's topo?</p>
                        </article>

                        <footer class="flex justify-end">
                          <form method="POST" action="?/removeRoute" use:enhance>
                            <input hidden name="routeFk" value={route.id} />
                            <input hidden name="topoFk" value={topos[selectedTopoIndex].id} />
                            <button class="btn btn-sm preset-filled-error-500 !text-white" type="submit">Yes</button>
                          </form>
                        </footer>
                      {/snippet}
                    </Popover>
                  {/if}
                </span>
              {:else}
                <span class="text-primary-500 list-option hover:!bg-inherit flex justify-between">
                  <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} {route} />

                  <form method="POST" action="?/addRoute" use:enhance>
                    <input hidden name="routeFk" value={form?.routeFk ?? route.id} />
                    <input hidden name="topoFk" value={form?.topoFk ?? topos[selectedTopoIndex].id} />

                    <button class="btn btn-sm preset-outlined-primary-500" type="submit">Add topo</button>
                  </form>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>

      <div class="flex justify-between">
        <Popover
          arrow
          arrowBackground="!bg-surface-200 dark:!bg-surface-800"
          contentBase="card bg-surface-200-800 p-2 md:p-4 space-y-4 max-w-[320px]"
          positioning={{ placement: 'top' }}
          triggerBase="btn preset-filled-error-500 !text-white"
        >
          {#snippet trigger()}
            <i class="fa-solid fa-trash"></i>Remove image
          {/snippet}

          {#snippet content()}
            <article>
              <p>Are you sure you want to delete this image?</p>
            </article>

            <footer class="flex justify-end">
              <form method="POST" action="?/removeTopo" use:enhance>
                <input hidden name="id" value={topos[selectedTopoIndex].id} />
                <button class="btn btn-sm preset-filled-error-500 !text-white" type="submit">Yes</button>
              </form>
            </footer>
          {/snippet}
        </Popover>

        <a class="btn preset-filled-primary-500" href="{basePath}/add-topo">
          <i class="fa-solid fa-plus"></i>Add image
        </a>
      </div>
    </div>
  </section>
</div>

<div class="flex justify-between mt-8">
  <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
</div>
