import type { File } from '$lib/db/schema'
import type { FileStat } from 'webdav'

export interface FileDTO extends File {
  error?: string
  stat?: FileStat
}
