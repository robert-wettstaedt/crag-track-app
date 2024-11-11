<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import FirstAscentFormFields from '$lib/components/FirstAscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, Popover } from '@skeletonlabs/skeleton-svelte'

  let { data, form } = $props()
  let basePath = $derived(
    `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`,
  )

  let grade = $derived(data.grades.find((grade) => grade.id === data.route.gradeFk))
</script>

<svelte:head>
  <title>
    Edit FA of
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - Crag Track
  </title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit FA of</span>
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.route} />
    </a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-4 preset-filled-surface-100-900" action="?/updateFirstAscent" method="POST" use:enhance>
  <FirstAscentFormFields
    climberName={form?.climberName ?? data.route.firstAscent?.climber?.userName ?? data.route.firstAscent?.climberName}
    climbers={data.climbers}
    year={form?.year ?? data.route.firstAscent?.year}
  />

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>

    <div>
      <Popover
        arrow
        arrowBackground="!bg-surface-200 dark:!bg-surface-800"
        contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px]"
        positioning={{ placement: 'top' }}
        triggerBase="btn preset-filled-error-500 !text-white"
      >
        {#snippet trigger()}
          <i class="fa-solid fa-trash"></i>Delete FA
        {/snippet}

        {#snippet content()}
          <article>
            <p>Are you sure you want to delete this FA?</p>
          </article>

          <footer class="flex justify-end">
            <form method="POST" action="?/removeFirstAscent" use:enhance>
              <button class="btn btn-sm preset-filled-error-500 !text-white" type="submit">Yes</button>
            </form>
          </footer>
        {/snippet}
      </Popover>

      <button class="btn preset-filled-primary-500" type="submit">Update FA</button>
    </div>
  </div>
</form>
