<script lang="ts">
  import { page } from '$app/stores'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/boulders/${$page.params.boulderSlug}`
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Log ascent of</span>
    &nbsp;
    <a class="anchor" href={basePath}>
      {data.boulder.name}
      {#if data.boulder.gradingScale != null}({data.boulder.gradingScale} {data.boulder.grade}){/if}
    </a>
  </svelte:fragment>
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
    <AscentFormFields
      dateTime={form?.dateTime ?? DateTime.now().toSQLDate()}
      grade={form?.grade ?? null}
      gradingScale={data.boulder.gradingScale}
      notes={form?.notes ?? null}
      type={form?.type ?? null}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Save ascent</button>
  </div>
</form>
