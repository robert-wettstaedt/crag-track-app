import { writable } from 'svelte/store'

export const selectedRouteStore = writable(null as number | null)
export const highlightedRouteStore = writable(null as number | null)
