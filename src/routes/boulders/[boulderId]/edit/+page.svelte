<script lang="ts">
  import BoulderFormFields from '$lib/components/BoulderFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <button class="btn" on:click={() => history.back()} type="button">
      <i class="fa-solid fa-arrow-left text-2xl" />
    </button>
  </svelte:fragment>

  Edit boulder "{data.boulder.name}"
</AppBar>

<form method="POST">
  {#if form?.error}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <BoulderFormFields
      crags={data.crags}
      grade={form?.grade ?? data.boulder.grade}
      gradingScale={form?.gradingScale ?? data.boulder.gradingScale}
      name={form?.name ?? data.boulder.name}
      parent={form?.parent ?? data.boulder.parent}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update boulder</button>
  </div>
</form>
