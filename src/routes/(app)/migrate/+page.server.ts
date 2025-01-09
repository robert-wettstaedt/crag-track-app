import { migrate } from '$lib/db/scripts/migrate-block-order'

export const load = async () => {
  await migrate()
}
