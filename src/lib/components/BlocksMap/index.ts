import type { InferResultType } from '$lib/db/types'

export { default } from './BlocksMap.svelte'

export type NestedBlock = InferResultType<'blocks', { area: { with: { parent: true } }; geolocation: true }>

export type GetBlockKey = ((block: NestedBlock, index: number) => string | number) | null
