<script lang="ts">
  import { enhance } from '$app/forms'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
</script>

<svelte:head>
  <title>Tags - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">Tags</svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-soft-primary" href="/tags/add">
        <i class="fa-solid fa-plus me-2" /> Add tag
      </a>
    {/if}
  </svelte:fragment>
</AppBar>

{#if form?.error}
  <aside class="alert variant-filled-error mt-8">
    <div class="alert-message">
      <p>{form.error}</p>
    </div>
  </aside>
{/if}

<div class="table-container">
  <!-- Native Table Element -->
  <table class="table table-hover">
    <thead>
      <tr>
        <th class="w-full">Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each data.tags as tag}
        <tr>
          <td>{tag.id}</td>

          <td>
            <div class="flex gap-2">
              <a href="/tags/{tag.id}/edit" class="btn btn-sm variant-filled-primary">Edit</a>

              <form action="?/delete" method="POST" use:enhance>
                <input type="hidden" name="id" value={tag.id} />

                <button type="submit" class="btn btn-sm variant-filled-error">Delete</button>
              </form>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
