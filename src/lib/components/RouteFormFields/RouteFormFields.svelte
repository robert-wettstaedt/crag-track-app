<script lang="ts">
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import type { InsertRoute, Route, Tag } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { grades } from '$lib/grades'
  import { Ratings, Tab, TabGroup } from '@skeletonlabs/skeleton'
  import remarkHtml from 'remark-html'
  import remarkParse from 'remark-parse'
  import type { ChangeEventHandler } from 'svelte/elements'
  import { unified } from 'unified'

  export let blockId: number
  export let description: Route['description']
  export let grade: Route['grade']
  export let gradingScale: Route['gradingScale'] | undefined
  export let name: Route['name']
  export let rating: Route['rating']
  export let routeTags: string[]
  export let tags: Tag[]

  let routeExternalResources: InferResultType<
    'routeExternalResources',
    { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
  >

  let loading = false

  const onChangeGradingScale: ChangeEventHandler<HTMLSelectElement> = (event) => {
    gradingScale = event.currentTarget.value as Route['gradingScale']
  }

  let descriptionTabSet: number = 0
  let descriptionValue = description
  let descriptionHtml = ''
  const onChangeDescription: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    descriptionValue = event.currentTarget.value
    parseDescription(descriptionValue)
  }

  const parseDescription = async (description: string) => {
    const result = await unified().use(remarkParse).use(remarkHtml).process(description)
    descriptionHtml = result.value as string
  }

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
    grade = route.grade ?? null
    gradingScale = route.gradingScale ?? null
    rating = route.rating ?? null
    description = route.description ?? null
    descriptionValue = route.description ?? null
    parseDescription(description ?? '')

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
  <div class="flex gap-2 mt-4">
    {#if routeExternalResources.externalResource8a?.url != null}
      <a class="btn variant-ghost" href={routeExternalResources.externalResource8a.url} target="_blank">
        <img src={Logo8a} alt="The Crag" width={24} height={24} />
      </a>
    {/if}

    {#if routeExternalResources.externalResource27crags?.url != null}
      <a class="btn variant-ghost" href={routeExternalResources.externalResource27crags.url} target="_blank">
        <img src={Logo27crags} alt="27crags" width={24} height={24} />
      </a>
    {/if}

    {#if routeExternalResources.externalResourceTheCrag?.url != null}
      <a class="btn variant-ghost" href={routeExternalResources.externalResourceTheCrag.url} target="_blank">
        <img src={LogoTheCrag} alt="The Crag" width={24} height={24} />
      </a>
    {/if}
  </div>
{/if}

<label class="label mt-4">
  <span>Grading scale</span>
  <select class="select" name="gradingScale" on:change={onChangeGradingScale} size="2" value={gradingScale}>
    <option value="FB">FB</option>
    <option value="V">V</option>
  </select>
</label>

<label class="label mt-4">
  <span>Grade</span>
  <select class="select" name="grade" size="8" value={grade}>
    {#if gradingScale == null}
      <option disabled>Select grading scale first...</option>
    {:else}
      {#each grades as grade}
        <option value={grade[gradingScale]}>{gradingScale} {grade[gradingScale]}</option>
      {/each}
    {/if}
  </select>
</label>

<label class="label mt-4">
  <span>Description</span>
  <textarea hidden name="description" value={descriptionValue} />

  <TabGroup>
    <Tab bind:group={descriptionTabSet} name="Write" value={0}>Write</Tab>
    <Tab bind:group={descriptionTabSet} name="Preview" value={1}>Preview</Tab>

    <svelte:fragment slot="panel">
      {#if descriptionTabSet === 0}
        <textarea
          class="textarea"
          on:keyup={onChangeDescription}
          placeholder="Enter some long form content."
          rows="10"
          value={descriptionValue}
        />
      {:else if descriptionTabSet === 1}
        <div class="rendered-markdown min-h-64 bg-surface-700 px-3 py-2">
          {@html descriptionHtml}
        </div>
      {/if}
    </svelte:fragment>
  </TabGroup>
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
