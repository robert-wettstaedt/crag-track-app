<script lang="ts">
  import AscentFormFields from '$lib/components/AscentFormFields'
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

  Edit ascent of "{data.boulder.name}"
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
    <AscentFormFields
      dateTime={form?.dateTime ?? data.ascent.dateTime}
      grade={form?.grade ?? data.ascent.grade}
      gradingScale={data.boulder.gradingScale}
      notes={form?.notes ?? data.ascent.notes}
      type={form?.type ?? data.ascent.type}
      filePath={form?.filePath ?? (data.session?.user?.email == null ? '' : `/${data.session.user.email}/`)}
    />

    <div class="flex justify-between mt-4">
      <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
      <button class="btn variant-filled-primary">Update ascent</button>
    </div>
  </div>
</form>
