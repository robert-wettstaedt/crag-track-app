<script lang="ts">
  import MarkdownEditor from '$lib/components/MarkdownEditor'
  import RouteExternalResourceLinks from '$lib/components/RouteExternalResourceLinks'
  import type { Grade, InsertRoute, Route, Tag, UserSettings } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { Ratings } from '@skeletonlabs/skeleton'
  import type { ChangeEventHandler } from 'svelte/elements'

  export let blockId: number
  export let description: Route['description']
  export let gradeFk: Route['gradeFk']
  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] | null | undefined
  export let name: Route['name']
  export let rating: Route['rating']
  export let routeTags: string[]
  export let tags: Tag[]

  let routeExternalResources: InferResultType<
    'routeExternalResources',
    { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
  >

  let loading = false

  const onChangeName: ChangeEventHandler<HTMLInputElement> = async (event) => {
    loading = true
    const searchParams = new URLSearchParams({
      blockId: blockId.toString(),
      query: event.currentTarget.value,
    })
    const response = await fetch(`/api/search-external?${searchParams.toString()}`)
    const { route, ...rest } = (await response.json()) as {
      route: InsertRoute
      routeExternalResources: InferResultType<
        'routeExternalResources',
        { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
      >
    }

    name = route.name ?? null
    gradeFk = route.gradeFk ?? null
    rating = route.rating ?? null
    description = route.description ?? null
    description = route.description ?? null

    routeExternalResources = rest.routeExternalResources
    loading = false
  }
</script>

<p>Name</p>
<div class="input-group input-group-divider grid-cols-[1fr_auto]">
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} on:change={onChangeName} />

  {#if loading}
    <div class="input-group-shim">
      <i class="fa-solid fa-spinner fa-spin" />
    </div>
  {/if}
</div>

{#if routeExternalResources != null}
  <div class="mt-4">
    <RouteExternalResourceLinks iconSize={24} {routeExternalResources} />
  </div>
{/if}

<label class="label mt-4">
  <span>Grade</span>
  <select class="select" name="gradeFk" size="8" value={gradeFk}>
    {#each grades as grade}
      <option value={grade.id}>{grade[gradingScale ?? 'FB']}</option>
    {/each}
  </select>
</label>

<label class="label mt-4">
  <span>Description</span>
  <textarea hidden name="description" value={description} />

  <MarkdownEditor value={description} {grades} {gradingScale} on:change={(event) => (description = event.detail)} />
</label>

<label class="label mt-4">
  <span>Rating</span>
  <input name="rating" type="hidden" value={rating} />
</label>

<Ratings
  interactive
  justify="start"
  max={3}
  on:icon={(event) => (rating = event.detail.index)}
  value={rating ?? undefined}
>
  <svelte:fragment slot="empty"><i class="fa-regular fa-star text-3xl text-warning-500" /></svelte:fragment>
  <svelte:fragment slot="full"><i class="fa-solid fa-star text-3xl text-warning-500" /></svelte:fragment>
</Ratings>

<label class="label mt-4">
  <span>Tags</span>
  <select class="select" multiple name="tags" size="8" value={routeTags}>
    {#each tags as tag}
      <option value={tag.id}>{tag.id}</option>
    {/each}
  </select>
</label>
