<script lang="ts">
  import AscentTypeLabel from '$lib/components/AscentTypeLabel'
  import FileBrowser from '$lib/components/FileBrowser'
  import MarkdownEditor from '$lib/components/MarkdownEditor'
  import type { Ascent, File, Grade, UserSettings } from '$lib/db/schema'
  import { Modal } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'
  import type { MouseEventHandler } from 'svelte/elements'
  import { run } from 'svelte/legacy'

  interface Props {
    dateTime: Ascent['dateTime']
    filePaths?: File['path'][]
    gradeFk: Ascent['gradeFk']
    grades: Grade[]
    gradingScale: UserSettings['gradingScale'] | null | undefined
    notes: Ascent['notes']
    type: Ascent['type'] | null
  }

  let { dateTime, filePaths = $bindable(['']), gradeFk, grades, gradingScale, notes, type }: Props = $props()
  let modalOpen = $state(false)

  run(() => {
    ;(() => {
      const lastFile = filePaths.at(-1)

      if (lastFile != null && lastFile.length > 0) {
        filePaths = [...filePaths, '']
      }
    })()
  })

  const onRemoveFile =
    (index: number): MouseEventHandler<HTMLButtonElement> =>
    (event) => {
      event.preventDefault()
      filePaths = filePaths.filter((_, i) => i !== index)

      if (filePaths.length === 0) {
        filePaths = ['']
      }
    }
</script>

<label class="label mt-4">
  <span>Grade</span>
  <select class="select max-h-[300px] overflow-auto" name="gradeFk" size="8" value={gradeFk}>
    {#each grades as grade}
      <option value={grade.id}>{grade[gradingScale ?? 'FB']}</option>
    {/each}
  </select>
</label>

<label class="label mt-4">
  <span>Type</span>
  <select class="select max-h-[300px] overflow-auto" name="type" size="4" value={type}>
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

{#each filePaths as filePath, index}
  <div class="mt-4">
    <label class="label">
      <span>File {filePaths.length > 1 ? index + 1 : ''}</span>

      <div class="flex items-center gap-2">
        {#if filePath.length > 0}
          <img alt="" height="42" src={`/nextcloud${filePath}/preview?x=42&y=42&mimeFallback=true&a=0`} width="42" />
        {/if}

        <input class="input" disabled placeholder="Path" type="text" value={filePath} />
        <input name="filePaths" type="hidden" value={filePath} />

        {#if filePath.length === 0}
          <Modal
            bind:open={modalOpen}
            triggerBase="btn preset-filled-primary-500"
            contentBase="card bg-surface-100-900 p-2 md:p-4 space-y-4 shadow-xl max-w-screen-sm"
            backdropClasses="backdrop-blur-sm"
          >
            {#snippet trigger()}
              Choose
            {/snippet}

            {#snippet content()}
              <header class="flex justify-between">
                <h2 class="h2">File Browser</h2>
              </header>

              <article>
                <FileBrowser
                  onChange={(value: string | null) => {
                    if (value != null) {
                      filePaths[index] = value
                      modalOpen = false
                    }
                  }}
                />
              </article>

              <footer class="flex justify-end gap-4">
                <button type="button" class="btn preset-tonal" onclick={() => (modalOpen = false)}>Cancel</button>
                <button type="button" class="btn preset-filled" onclick={() => (modalOpen = false)}>Confirm</button>
              </footer>
            {/snippet}
          </Modal>
        {:else}
          <button class="btn preset-filled-error-500 !text-white" onclick={onRemoveFile(index)}>Remove</button>
        {/if}
      </div>
    </label>
  </div>
{/each}

<label class="label mt-4">
  <span>Notes</span>
  <textarea hidden name="notes" value={notes}></textarea>

  <MarkdownEditor {grades} {gradingScale} bind:value={notes} />
</label>
