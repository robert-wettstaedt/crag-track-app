<script lang="ts">
  import type { Area } from '$lib/db/schema'
  import { Tab, TabGroup } from '@skeletonlabs/skeleton'
  import remarkHtml from 'remark-html'
  import remarkParse from 'remark-parse'
  import type { ChangeEventHandler } from 'svelte/elements'
  import { unified } from 'unified'

  export let description: Area['description']
  export let name: Area['name']
  export let type: Area['type']

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
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
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
  <span>Type</span>
  <select class="select" name="type" size="3" value={type}>
    <option value="area">Area</option>
    <option value="crag">Crag</option>
    <option value="sector">Sector</option>
  </select>
</label>
