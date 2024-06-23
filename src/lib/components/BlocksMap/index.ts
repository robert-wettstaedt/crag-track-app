import type { EnrichedBlock } from '$lib/db/utils'

export { default } from './BlocksMap.svelte'

export type GetBlockKey = ((block: EnrichedBlock, index: number) => string | number) | null
