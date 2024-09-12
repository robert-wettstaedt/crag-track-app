<script lang="ts">
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  import AscentTypeLabel from '$lib/components/AscentTypeLabel'
  import FileBrowser from '$lib/components/FileBrowser'
  import type { Ascent, File, Grade, Route, UserSettings } from '$lib/db/schema'
  import { Tab, TabGroup, getModalStore, type ModalSettings } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'
  import remarkHtml from 'remark-html'
  import remarkParse from 'remark-parse'
  import type { ChangeEventHandler, MouseEventHandler } from 'svelte/elements'
  import { unified } from 'unified'

  export let dateTime: Ascent['dateTime']
  export let filePaths: File['path'][] = ['']
  export let gradeFk: Ascent['gradeFk']
  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] | null | undefined
  export let notes: Ascent['notes']
  export let type: Ascent['type'] | null

  $: (() => {
    const lastFile = filePaths.at(-1)

    if (lastFile != null && lastFile.length > 0) {
      filePaths = [...filePaths, '']
    }
  })()

  const modalStore = getModalStore()

  let notesTabSet: number = 0
  let notesValue = notes
  let notesHtml = ''

  const onChangeNotes: ChangeEventHandler<HTMLTextAreaElement> = async (event) => {
    notesValue = event.currentTarget.value
    const result = await unified().use(remarkParse).use(remarkHtml).process(notesValue)
    notesHtml = result.value as string
  }

  const onRemoveFile =
    (index: number): MouseEventHandler<HTMLButtonElement> =>
    (event) => {
      event.preventDefault()
      filePaths = filePaths.filter((_, i) => i !== index)

      if (filePaths.length === 0) {
        filePaths = ['']
      }
    }

  const onChooseFile =
    (index: number): MouseEventHandler<HTMLButtonElement> =>
    (event) => {
      event.preventDefault()

      const modal: ModalSettings = {
        backdropClasses: '!overflow-y-auto',
        component: {
          ref: FileBrowser,
          props: {
            onChange: (value: string | null) => {
              if (value != null) {
                filePaths[index] = value
                modalStore.close()
              }
            },
          },
        },
        title: 'File Browser',
        type: 'component',
      }

      modalStore.trigger(modal)
    }
</script>

<label class="label mt-4">
  <span>Grade</span>
  <select class="select" name="gradeFk" size="8" value={gradeFk}>
    {#each grades as grade}
      <option value={grade.id}>{grade[gradingScale ?? 'FB']}</option>
    {/each}
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

{#each filePaths as filePath, index}
  <div class="mt-4">
    <label class="label">
      <span>File {filePaths.length > 1 ? index + 1 : ''}</span>

      <div class="flex">
        {#if filePath.length > 0}
          <img alt="" height="42" src={`/nextcloud${filePath}/preview?x=42&y=42&mimeFallback=true&a=0`} width="42" />
        {/if}

        <input class="input" disabled placeholder="Path" type="text" value={filePath} />
        <input name="file.path" type="hidden" value={filePath} />

        {#if filePath.length === 0}
          <button class="btn variant-filled-primary" on:click={onChooseFile(index)}>Choose</button>
        {:else}
          <button class="btn variant-filled-error" on:click={onRemoveFile(index)}>Remove</button>
        {/if}
      </div>
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
