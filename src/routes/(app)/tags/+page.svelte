<script lang="ts">
  import { enhance } from '$app/forms'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import { Popover } from '@skeletonlabs/skeleton-svelte'

  let { data, form } = $props()
</script>

<svelte:head>
  <title>Tags - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Tags
  {/snippet}

  {#snippet trail()}
    {#if data.userPermissions?.includes('data.edit')}
      <a class="btn btn-sm preset-filled-primary-500" href="/tags/add">
        <i class="fa-solid fa-plus"></i> Add tag
      </a>
    {/if}
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<div class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900 table-wrap">
  {#if data.tags.length === 0}
    No tags yet
  {:else}
    <table class="table table-hover">
      <thead>
        <tr>
          <th class="w-full">Name</th>

          {#if data.userPermissions?.includes('data.edit')}
            <th>Actions</th>
          {/if}
        </tr>
      </thead>

      <tbody class="hover:[&>tr]:preset-tonal-primary">
        {#each data.tags as tag}
          <tr>
            <td>{tag.id}</td>

            {#if data.userPermissions?.includes('data.edit')}
              <td>
                <div class="flex items-center gap-2">
                  <a href="/tags/{tag.id}/edit" class="btn btn-sm preset-filled-primary-500">Edit</a>

                  <Popover
                    arrow
                    arrowBackground="!bg-surface-200 dark:!bg-surface-800"
                    contentBase="card bg-surface-200-800 p-2 md:p-4 space-y-4 max-w-[320px]"
                    positioning={{ placement: 'top' }}
                    triggerBase="btn btn-sm preset-filled-error-500 !text-white"
                  >
                    {#snippet trigger()}
                      <i class="fa-solid fa-trash"></i>Delete
                    {/snippet}

                    {#snippet content()}
                      <article>
                        <p>Are you sure you want to delete this tag?</p>
                      </article>

                      <footer class="flex justify-end">
                        <form action="?/delete" method="POST" use:enhance>
                          <input type="hidden" name="id" value={tag.id} />

                          <button class="btn btn-sm preset-filled-error-500 !text-white" type="submit">Yes</button>
                        </form>
                      </footer>
                    {/snippet}
                  </Popover>
                </div>
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
