<script lang="ts">
  import type { Block } from '$lib/db/schema'
  import FileUpload, { type FileUploadProps } from '$lib/components/FileUpload'

  interface Props {
    name: Block['name']
    fileUploadProps?: FileUploadProps
  }

  let { name, fileUploadProps }: Props = $props()
</script>

<label class="label">
  <span>Name</span>
  <input class="input" name="name" type="text" placeholder="Enter name..." value={name} />
</label>

{#if fileUploadProps != null}
  <FileUpload accept="image/*" label="Topo image" {...fileUploadProps} />
{/if}
