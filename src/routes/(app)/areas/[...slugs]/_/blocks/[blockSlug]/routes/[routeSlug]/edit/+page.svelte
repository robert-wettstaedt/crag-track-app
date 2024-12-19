<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import RouteFormFields from '$lib/components/RouteFormFields'
  import RouteName from '$lib/components/RouteName'
  import { Popover } from '@skeletonlabs/skeleton-svelte'

  let { data, form } = $props()
  let basePath = $derived(
    `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`,
  )

  let grade = $derived(data.grades.find((grade) => grade.id === data.route.gradeFk))
</script>

<svelte:head>
  <title>
    Edit
    {data.route.rating == null ? '' : `${Array(data.route.rating).fill('★').join('')} `}
    {data.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - {PUBLIC_APPLICATION_NAME}
  </title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit route</span>
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.route} />
    </a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4 whitespace-pre-line">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" action="?/updateRoute" method="POST" use:enhance>
  <RouteFormFields
    blockId={data.route.blockFk}
    description={form?.description ?? data.route.description}
    gradeFk={form?.gradeFk ?? data.route.gradeFk}
    grades={data.grades}
    gradingScale={data.user?.userSettings?.gradingScale}
    name={form?.name ?? data.route.name}
    rating={form?.rating ?? data.route.rating ?? undefined}
    routeTags={form?.tags ?? data.route.tags.map((tag) => tag.tagFk)}
    tags={data.tags}
  />

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>

    <div class="flex flex-col-reverse gap-8 md:flex-row md:gap-4">
      <Popover
        arrow
        arrowBackground="!bg-surface-200 dark:!bg-surface-800"
        contentBase="card bg-surface-200-800 p-2 md:p-4 space-y-4 max-w-[320px]"
        positioning={{ placement: 'top' }}
        triggerBase="btn preset-filled-error-500 !text-white"
      >
        {#snippet trigger()}
          <i class="fa-solid fa-trash"></i>Delete route
        {/snippet}

        {#snippet content()}
          <article>
            <p>Are you sure you want to delete this route?</p>
          </article>

          <footer class="flex justify-end">
            <form method="POST" action="?/removeRoute" use:enhance>
              <button class="btn btn-sm preset-filled-error-500 !text-white" type="submit">Yes</button>
            </form>
          </footer>
        {/snippet}
      </Popover>

      <button class="btn preset-filled-primary-500" type="submit">Update route</button>
    </div>
  </div>
</form>
