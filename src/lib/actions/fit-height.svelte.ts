import { afterNavigate } from '$app/navigation'
import { onMount } from 'svelte'
import type { Action } from 'svelte/action'

interface Opts {
  heightSubtrahend?: number
  paddingBottom?: number
}

export const fitHeightAction: Action<HTMLElement, Opts | undefined> = (node, opts) => {
  const { heightSubtrahend = 0, paddingBottom = 32 } = opts ?? {}
  let observer: ResizeObserver | null = $state(null)

  const calcHeight = () => {
    const bcr = node.getBoundingClientRect()
    const navBarBcr = document.querySelector('[data-testid="nav-bar"]')?.getBoundingClientRect()
    const h = heightSubtrahend > 0 ? heightSubtrahend : (navBarBcr?.height ?? 0)

    node.style.height = `${window.innerHeight - bcr.top - paddingBottom - h}px`
  }

  onMount(() => {
    observer = new ResizeObserver(calcHeight)
    observer.observe(node)
  })

  afterNavigate(() => {
    requestAnimationFrame(calcHeight)
  })

  return {
    destroy: () => {
      observer?.disconnect()
    },
  }
}
