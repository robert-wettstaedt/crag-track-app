import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import Database from 'postgres'
import { createClient } from 'webdav'
import drizzleConfig from '../../../../drizzle.config'
import * as schema from '../schema'

dotenv.config()

const postgres = Database(drizzleConfig.dbCredentials.url, { prepare: false })
const db = drizzle(postgres, { schema })

const { NEXTCLOUD_URL, NEXTCLOUD_USER_NAME, NEXTCLOUD_USER_PASSWORD } = process.env

const nextcloud = createClient(NEXTCLOUD_URL + '/remote.php/dav/files', {
  username: NEXTCLOUD_USER_NAME,
  password: NEXTCLOUD_USER_PASSWORD,
})

const files = await db.query.files.findMany({
  with: {
    ascent: {
      with: {
        author: true,
      },
    },
  },
})

async function processBatch<T>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number, total: number) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await Promise.all(batch.map((item) => processor(item, i + batch.indexOf(item), items.length)))
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

async function migrateFile(oldPath: string, newPath: string, fileId: number): Promise<void> {
  if (oldPath === newPath) {
    return
  }

  try {
    await nextcloud.copyFile(NEXTCLOUD_USER_NAME + oldPath, NEXTCLOUD_USER_NAME + newPath)
    await db.update(schema.files).set({ path: newPath }).where(eq(schema.files.id, fileId))
  } catch (exception) {
    console.error(`Error migrating file ${fileId} from ${oldPath} to ${newPath}:`)
    // console.error(exception)
  }
}

if (!(await nextcloud.exists(NEXTCLOUD_USER_NAME + '/topos'))) {
  await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + '/topos')
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

const topoFiles = files.filter((file) => file.ascent == null && !file.path.startsWith(`/topos/${file.id}.`))
console.log('Migrating topos...', topoFiles.length)

await processBatch(topoFiles, 10, async (file, index, total) => {
  const ext = file.path.split('.').pop() || ''
  const oldPath = file.path.replace('/topos/', '/topos-old/')
  const newPath = `/topos/${file.id}.${ext}`
  await migrateFile(oldPath, newPath, file.id)
  console.log(`${index + 1} / ${total} === ${oldPath} -> ${newPath}`)
})

const userFiles = files.filter(
  (file) => file.ascent != null && !file.path.startsWith(`/user-content/${file.ascent!.author.authUserFk}/${file.id}.`),
)
const userSet = new Set(userFiles.map((file) => file.ascent!.author.authUserFk))
const userIds = Array.from(userSet)

for await (const userId of userIds) {
  if (!(await nextcloud.exists(NEXTCLOUD_USER_NAME + '/user-content/' + userId))) {
    await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + '/user-content/' + userId, { recursive: true })
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

console.log('Migrating user content...', userFiles.length)

await processBatch(userFiles, 10, async (file, index, total) => {
  const ext = file.path.split('.').pop() || ''
  const oldPath = file.path
  const newPath = `/user-content/${file.ascent!.author.authUserFk}/${file.id}.${ext}`
  await migrateFile(oldPath, newPath, file.id)
  console.log(`${index + 1} / ${total} === ${oldPath} -> ${newPath}`)
})

await postgres.end()
