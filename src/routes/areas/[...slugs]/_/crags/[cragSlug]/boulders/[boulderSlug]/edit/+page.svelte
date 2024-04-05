<script lang="ts">
  import { page } from '$app/stores'
  import BoulderFormFields from '$lib/components/BoulderFormFields'
  import BoulderName from '$lib/components/BoulderName'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/boulders/${$page.params.boulderSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit boulder</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      <BoulderName boulder={data.boulder} />
    </a>
  </svelte:fragment>
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
      grade={form?.grade ?? data.boulder.grade}
      gradingScale={form?.gradingScale ?? data.boulder.gradingScale}
      name={form?.name ?? data.boulder.name}
    />
  </div>

  <div class="flex justify-between mt-4">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Update boulder</button>
  </div>
</form>
