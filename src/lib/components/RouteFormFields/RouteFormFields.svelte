<script lang="ts">
  import type { Route, Tag } from '$lib/db/schema'
  import type { InferResultType } from '$lib/db/types'
  import { grades } from '$lib/grades'
  import { Tab, TabGroup } from '@skeletonlabs/skeleton'
  import remarkHtml from 'remark-html'
  import remarkParse from 'remark-parse'
  import type { ChangeEventHandler } from 'svelte/elements'
  import { unified } from 'unified'

  export let description: Route['description']
  export let grade: Route['grade']
  export let gradingScale: Route['gradingScale'] | undefined
  export let name: Route['name']
  export let routeTags: string[]
  export let tags: Tag[]

  const onChangeGradingScale: ChangeEventHandler<HTMLSelectElement> = (event) => {
    gradingScale = event.currentTarget.value as Route['gradingScale']
  }

  let descriptionTabSet: number = 0
  let descriptionValue = description
  let descriptionHtml = ''
  const onChangeDescription: ChangeEventHandler<HTMLTextAreaElement> = async (event) => {
    descriptionValue = event.currentTarget.value
    const result = await unified().use(remarkParse).use(remarkHtml).process(descriptionValue)
    descriptionHtml = result.value as string
  }
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>

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
  <span>Tags</span>
  <select class="select" multiple name="tags" size="8" value={routeTags}>
    {#each tags as tag}
      <option value={tag.id}>{tag.id}</option>
    {/each}
  </select>
</label>
