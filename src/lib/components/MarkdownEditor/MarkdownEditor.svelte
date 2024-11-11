<script lang="ts">
  import * as schema from '$lib/db/schema'
  import { convertMarkdownToHtml } from '$lib/markdown'
  import type { SearchedResources, SearchResults } from '$lib/search.server'
  import { autocompletion, type Completion, type CompletionSource } from '@codemirror/autocomplete'
  import { indentWithTab } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { EditorView, keymap, type EditorViewConfig } from '@codemirror/view'
  import { basicSetup } from 'codemirror'
  import debounce from 'lodash.debounce'
  import memoize from 'lodash.memoize'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    value: string | null
    grades: schema.Grade[]
    gradingScale: schema.UserSettings['gradingScale'] | null | undefined
  }

  let { value = $bindable(), grades, gradingScale }: Props = $props()

  let element: HTMLDivElement | undefined = $state()
  let view: EditorView | null = null
  let valueHtml = $state('')

  const loadData = async (query: string): Promise<SearchResults | null> => {
    const response = await fetch(`/api/search?q=${query}`)

    if (response.status !== 200) {
      return null
    }

    try {
      const json: SearchedResources | null = await response.json()
      return json?.searchResults ?? null
    } catch (error) {
      return null
    }
  }

  const memoizedLoadData = memoize(loadData)

  const renderRouteName = (route: schema.Route): string => {
    return [
      route.name.length === 0 ? '?' : route.name,
      route.gradeFk == null ? null : grades.find((grade) => grade.id === route.gradeFk)?.[gradingScale ?? 'FB'],
      route.rating == null ? null : new Array(route.rating).fill('⭐️').join(''),
    ]
      .filter(Boolean)
      .join(' • ')
  }

  const completion: CompletionSource = async (context) => {
    let before = context.matchBefore(/!\w+/)

    if (before == null) {
      return null
    }

    const query = before.text.substring(1)
    const searchResults = await memoizedLoadData(query)

    if (searchResults == null) {
      return null
    }

    return {
      from: before ? before.from : context.pos,
      options: [
        ...searchResults.routes.map(
          (item): Completion => ({
            apply: `!routes:${item.id}!`,
            info: `${renderRouteName(item)}\n\n${item.description ?? ''}`,
            label: `${item.block.area.name} > ${item.block.name} > ${renderRouteName(item)}`,
            section: 'Routes',
            type: 'class',
          }),
        ),
        ...searchResults.blocks.map(
          (item): Completion => ({
            apply: `!blocks:${item.id}!`,
            info: item.name,
            label: `${item.area.name} > ${item.name}`,
            section: 'Blocks',
            type: 'class',
          }),
        ),
        ...searchResults.areas.map(
          (item): Completion => ({
            apply: `!areas:${item.id}!`,
            info: `${item.name}\n\n${item.description ?? ''}`,
            label: item.name,
            section: 'Areas',
            type: 'class',
          }),
        ),
      ],
      validFor: /!\w+/,
      filter: false,
    }
  }

  const debouncedCompletion = debounce(completion, 500)

  const theme = EditorView.theme(
    { '.cm-gutters': { backgroundColor: 'rgba(var(--color-surface-800))' } },
    { dark: true },
  )

  const transactionHandler: EditorViewConfig['dispatchTransactions'] = async (trs, view) => {
    view.update(trs)

    value = view.state.doc.toString()
    valueHtml = await convertMarkdownToHtml(value)
  }

  onMount(async () => {
    view = new EditorView({
      doc: value ?? '',
      parent: element,
      dispatchTransactions: transactionHandler,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        keymap.of([indentWithTab]),
        theme,
        markdown(),
        autocompletion({
          override: [(...args) => debouncedCompletion.apply(null, args) ?? null],
        }),
      ],
    })

    valueHtml = await convertMarkdownToHtml(value ?? '')
  })

  onDestroy(() => {
    view?.destroy()
  })
</script>

<div class="grid grid-cols-2 gap-4">
  <div bind:this={element} class="bg-surface-700"></div>

  <div class="rendered-markdown min-h-64 bg-surface-700 px-3 py-2">
    {@html valueHtml}
  </div>
</div>
