<script lang="ts">
  import { page } from '$app/stores'
  import MarkdownEditor from '$lib/components/MarkdownEditor'
  import RouteExternalResourceLinks from '$lib/components/RouteExternalResourceLinks'
  import type { InsertRoute, Route, Tag } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { Rating } from '@skeletonlabs/skeleton-svelte'
  import type { ChangeEventHandler } from 'svelte/elements'

  interface Props {
    blockId: number
    description: Route['description']
    gradeFk: Route['gradeFk']
    name: Route['name']
    rating: NonNullable<Route['rating']> | undefined
    routeTags: string[]
    tags: Tag[]
  }

  let {
    blockId,
    description = $bindable(),
    gradeFk = $bindable(),
    name = $bindable(),
    rating = $bindable(),
    routeTags,
    tags,
  }: Props = $props()

  let routeExternalResources:
    | InferResultType<
        'routeExternalResources',
        { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
      >
    | undefined = $state()

  let loading = $state(false)

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
    rating = route.rating ?? undefined
    description = route.description ?? null

    routeExternalResources = rest.routeExternalResources
    loading = false
  }
</script>

<p>Name</p>
<div class="input-group input-group-divider grid-cols-[1fr_auto]">
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} onchange={onChangeName} />

  {#if loading}
    <div class="btn">
      <i class="fa-solid fa-spinner fa-spin"></i>
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
  <select class="select" name="gradeFk" value={gradeFk ?? ''}>
    <option disabled value="">-- Select grade --</option>

    {#each $page.data.grades as grade}
      <option value={grade.id}>{grade[$page.data.gradingScale]}</option>
    {/each}
  </select>
</label>

<label class="label mt-4">
  <span>Description</span>
  <textarea hidden name="description" value={description}></textarea>

  <MarkdownEditor bind:value={description} />
</label>

<label class="label mt-4">
  <span>Rating</span>
  <input name="rating" type="hidden" value={rating} />
</label>

<Rating bind:value={rating} count={3}>
  {#snippet iconEmpty()}
    <i class="fa-regular fa-star text-3xl text-warning-500"></i>
  {/snippet}
  {#snippet iconFull()}
    <i class="fa-solid fa-star text-3xl text-warning-500"></i>
  {/snippet}
</Rating>

<label class="label mt-4">
  <span>Tags</span>
  <select class="select max-h-[300px] overflow-auto" multiple name="tags" value={routeTags}>
    {#each tags as tag}
      <option value={tag.id}>{tag.id}</option>
    {/each}
  </select>
</label>
