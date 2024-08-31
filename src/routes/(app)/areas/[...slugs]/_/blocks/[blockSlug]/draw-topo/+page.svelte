<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import TopoViewer, { highlightedRouteStore, selectedRouteStore } from '$lib/components/TopoViewer'
  import { convertPointsToPath, type TopoRouteDTO } from '$lib/topo'
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let form
  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`

  let dirtyRoutes: number[] = []
  let selectedTopoIndex = 0

  const onChangeTopo = (event: CustomEvent<TopoRouteDTO>) => {
    if (event.detail.routeFk != null) {
      dirtyRoutes = Array.from(new Set([...dirtyRoutes, event.detail.routeFk]))
      data.topos = data.topos
    }
  }
</script>

<svelte:head>
  <title>Draw topo of {data.block.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Draw topo of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.block.name}</a>
  </svelte:fragment>
</AppBar>

{#if form?.error != null}
  <aside class="alert variant-filled-error mt-8">
    <div class="alert-message">
      <p>{form.error}</p>
    </div>
  </aside>
{/if}

<div class="mt-8 flex">
  <section class="p-4 w-2/3">
    <TopoViewer editable={true} bind:selectedTopoIndex bind:topos={data.topos} on:change={onChangeTopo} />
  </section>

  <section class="p-4 w-1/3">
    <div class="card h-full flex flex-col justify-between">
      <nav class="list-nav">
        <ul>
          {#each data.block.routes as route}
            <li
              class={[$selectedRouteStore, $highlightedRouteStore].includes(route.id) && route.hasTopo
                ? 'bg-primary-500/20'
                : ''}
            >
              {#if route.hasTopo}
                <button
                  class="text-primary-500 list-option w-full flex justify-between"
                  on:mouseenter={() => highlightedRouteStore.set(route.id)}
                  on:mouseleave={() => highlightedRouteStore.set(null)}
                  on:click={() => selectedRouteStore.set(route.id)}
                  on:keydown={(event) => event.key === 'Enter' && selectedRouteStore.set(route.id)}
                >
                  <RouteName {route} />

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
                      <input hidden name="topoFk" value={form?.topoFk ?? data.topos[selectedTopoIndex].id} />
                      <input
                        hidden
                        name="id"
                        value={form?.id ??
                          data.topos.flatMap((topo) => topo.routes).find((topoRoute) => topoRoute.routeFk === route.id)
                            ?.id}
                      />
                      <input
                        hidden
                        name="topType"
                        value={form?.topType ??
                          data.topos.flatMap((topo) => topo.routes).find((topoRoute) => topoRoute.routeFk === route.id)
                            ?.topType}
                      />
                      <input
                        hidden
                        name="path"
                        value={form?.path ??
                          convertPointsToPath(
                            data.topos
                              .flatMap((topo) => topo.routes)
                              .find((topoRoute) => topoRoute.routeFk === route.id)?.points ?? [],
                          )}
                      />

                      <button class="btn btn-sm variant-soft-primary" type="submit">Save</button>
                    </form>
                  {:else}
                    <button
                      class="btn btn-sm variant-soft-error"
                      use:popup={{ event: 'click', target: `popup-delete-route-${route.id}`, placement: 'top' }}
                    >
                      <i class="fa-solid fa-trash" />
                    </button>
                  {/if}
                </button>
              {:else}
                <span class="text-primary-500 list-option hover:!bg-inherit flex justify-between">
                  <RouteName {route} />

                  <form method="POST" action="?/addRoute" use:enhance>
                    <input hidden name="routeFk" value={form?.routeFk ?? route.id} />
                    <input hidden name="topoFk" value={form?.topoFk ?? data.topos[selectedTopoIndex].id} />

                    <button class="btn btn-sm variant-ringed-primary" type="submit">Add topo</button>
                  </form>
                </span>
              {/if}

              <div class="card p-4 shadow-xl" data-popup="popup-delete-route-{route.id}">
                <p>Are you sure you want to delete this route's topo?</p>

                <div class="flex justify-end gap-2 mt-4">
                  <form method="POST" action="?/removeRoute" use:enhance>
                    <input hidden name="routeFk" value={route.id} />
                    <input hidden name="topoFk" value={data.topos[selectedTopoIndex].id} />

                    <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
                  </form>

                  <button class="btn btn-sm variant-filled-surface">Cancel</button>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      </nav>

      <div class="flex gap-2">
        <button
          class="btn variant-filled-error w-full"
          use:popup={{ event: 'click', target: 'popup-delete-topo', placement: 'top' }}
        >
          <i class="fa-solid fa-trash me-2" />Remove image
        </button>

        <a class="btn variant-filled-primary w-full" href="{basePath}/add-topo">
          <i class="fa-solid fa-plus me-2" />Add image
        </a>
      </div>
    </div>
  </section>
</div>

<div class="card p-4 shadow-xl" data-popup="popup-delete-topo">
  <p>Are you sure you want to delete this image?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeTopo" use:enhance>
      <input hidden name="id" value={data.topos[selectedTopoIndex].id} />

      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>

<div class="flex justify-between mt-8">
  <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
</div>
