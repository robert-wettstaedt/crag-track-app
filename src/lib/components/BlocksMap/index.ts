import type { InferResultType } from '$lib/db/types'

export { default } from './BlocksMap.svelte'

export type Block = InferResultType<'blocks', { area: { with: { parent: true } }; geolocation: true }>

export type GetBlockKey = ((block: Block, index: number) => string | number) | null
