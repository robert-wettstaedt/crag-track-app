<script lang="ts">
  import BoulderFormFields from '$lib/components/BoulderFormFields'
  import { AppBar, popup } from '@skeletonlabs/skeleton'
  import { goto } from '$app/navigation'

  export let form
  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <button class="btn" on:click={() => history.back()} type="button">
      <i class="fa-solid fa-arrow-left text-2xl" />
    </button>
  </svelte:fragment>

  Create boulder
</AppBar>

<form method="POST">
  {#if form?.error != null}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <BoulderFormFields
      crags={data.crags}
      grade={form?.grade ?? null}
      gradingScale={form?.gradingScale ?? null}
      name={form?.name ?? ''}
      parent={form?.parent ?? null}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Save boulder</button>
  </div>
</form>
