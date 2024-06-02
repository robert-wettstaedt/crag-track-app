<script lang="ts">
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import type { Ascent, File, Route } from '$lib/db/schema'
  import { Tab, TabGroup } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'
  import remarkHtml from 'remark-html'
  import remarkParse from 'remark-parse'
  import type { ChangeEventHandler } from 'svelte/elements'
  import { unified } from 'unified'
  import AscentTypeLabel from '../AscentTypeLabel/AscentTypeLabel.svelte'

  export let dateTime: Ascent['dateTime']
  export let gradingScale: Route['gradingScale']
  export let grade: Ascent['grade']
  export let notes: Ascent['notes']
  export let type: Ascent['type'] | null
  export let filePaths: File['path'][] = ['']

  let notesTabSet: number = 0
  let notesValue = notes
  let notesHtml = ''
  const onChangeNotes: ChangeEventHandler<HTMLTextAreaElement> = async (event) => {
    notesValue = event.currentTarget.value
    const result = await unified().use(remarkParse).use(remarkHtml).process(notesValue)
    notesHtml = result.value as string
  }

  const onChangeFile =
    (index: number): ChangeEventHandler<HTMLInputElement> =>
    (event) => {
      filePaths[index] = event.currentTarget.value

      const lastFile = filePaths.at(-1)
      if (lastFile != null && lastFile.length > 0) {
        return filePaths.push('')
      }

      const secondToLastFile = filePaths.at(-2)
      if (secondToLastFile != null && secondToLastFile.length === 0) {
        return filePaths.splice(-1, 1)
      }
    }
</script>

<label class="label mt-4">
  <span>Grade</span>
  <select class="select" name="grade" size="8" value={grade}>
    {#if gradingScale === 'FB'}
      <option value="5A">{gradingScale} 5A</option>
      <option value="5B">{gradingScale} 5B</option>
      <option value="5C">{gradingScale} 5C</option>
      <option value="6A">{gradingScale} 6A</option>
      <option value="6A+">{gradingScale} 6A+</option>
      <option value="6B">{gradingScale} 6B</option>
      <option value="6B+">{gradingScale} 6B+</option>
      <option value="6C">{gradingScale} 6C</option>
      <option value="6C+">{gradingScale} 6C+</option>
      <option value="7A">{gradingScale} 7A</option>
      <option value="7A+">{gradingScale} 7A+</option>
      <option value="7B">{gradingScale} 7B</option>
      <option value="7B+">{gradingScale} 7B+</option>
      <option value="7C">{gradingScale} 7C</option>
      <option value="7C+">{gradingScale} 7C+</option>
      <option value="8A">{gradingScale} 8A</option>
      <option value="8A+">{gradingScale} 8A+</option>
    {:else if gradingScale === 'V'}
      <option value="0">{gradingScale} 0</option>
      <option value="1">{gradingScale} 1</option>
      <option value="2">{gradingScale} 2</option>
      <option value="3">{gradingScale} 3</option>
      <option value="4">{gradingScale} 4</option>
      <option value="5">{gradingScale} 5</option>
      <option value="6">{gradingScale} 6</option>
      <option value="7">{gradingScale} 7</option>
      <option value="8">{gradingScale} 8</option>
      <option value="9">{gradingScale} 9</option>
      <option value="10">{gradingScale} 10</option>
      <option value="11">{gradingScale} 11</option>
      <option value="12">{gradingScale} 12</option>
      <option value="13">{gradingScale} 13</option>
    {:else}
      <option disabled>Select grading scale first...</option>
    {/if}
  </select>
</label>

<label class="label mt-4">
  <span>Type</span>
  <select class="select" name="type" size="4" value={type}>
    <option value="flash"><AscentTypeLabel type="flash" /></option>
    <option value="send"><AscentTypeLabel type="send" /></option>
    <option value="repeat"><AscentTypeLabel type="repeat" /></option>
    <option value="attempt"><AscentTypeLabel type="attempt" /></option>
  </select>
</label>

<label class="label mt-4">
  <span>Date</span>
  <input
    class="input"
    max={DateTime.now().toISODate()}
    name="dateTime"
    title="Input (date)"
    type="date"
    value={DateTime.fromSQL(dateTime).toISODate()}
  />
</label>

{#if PUBLIC_DEMO_MODE}
  <aside class="alert variant-filled-warning mt-4">
    <i class="fa-solid fa-triangle-exclamation" />

    <div class="alert-message">
      <p>File storage is disabled in demo mode</p>
    </div>
  </aside>
{/if}

{#each filePaths as file, index}
  <div class="mt-4">
    <label class="label">
      <span>File {filePaths.length > 1 ? index + 1 : ''}</span>
      <input
        class="input"
        name="file.path"
        on:change={onChangeFile(index)}
        placeholder="Path"
        type="text"
        value={file}
      />
    </label>
  </div>
{/each}

<label class="label mt-4">
  <span>Notes</span>
  <textarea hidden name="notes" value={notesValue} />

  <TabGroup>
    <Tab bind:group={notesTabSet} name="Write" value={0}>Write</Tab>
    <Tab bind:group={notesTabSet} name="Preview" value={1}>Preview</Tab>

    <svelte:fragment slot="panel">
      {#if notesTabSet === 0}
        <textarea
          class="textarea"
          on:keyup={onChangeNotes}
          placeholder="Enter some long form content."
          rows="10"
          value={notesValue}
        />
      {:else if notesTabSet === 1}
        <div class="rendered-markdown min-h-64 bg-surface-700 px-3 py-2">
          {@html notesHtml}
        </div>
      {/if}
    </svelte:fragment>
  </TabGroup>
</label>
