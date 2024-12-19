<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import AscentFormFields from '$lib/components/AscentFormFields'
  import RouteName from '$lib/components/RouteName'
  import { Popover } from '@skeletonlabs/skeleton-svelte'
  import type { ActionData, PageData } from './$types'

  interface Props {
    data: PageData
    form: ActionData
  }

  let { data, form }: Props = $props()
  let basePath = $derived(
    `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`,
  )

  let grade = $derived(data.grades.find((grade) => grade.id === data.ascent.route.gradeFk))
</script>

<svelte:head>
  <title>
    Edit ascent of
    {data.ascent.route.rating == null ? '' : `${Array(data.ascent.route.rating).fill('★').join('')} `}
    {data.ascent.route.name}
    {grade == null ? '' : ` (${grade[data.user?.userSettings?.gradingScale ?? 'FB']})`}
    - {PUBLIC_APPLICATION_NAME}
  </title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Edit ascent of</span>
    <a class="anchor" href={basePath}>
      <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} route={data.ascent.route} />
    </a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4 whitespace-pre-line">
    <p>{form.error}</p>
  </aside>
{/if}

<form class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900" action="?/updateAscent" method="POST" use:enhance>
  <AscentFormFields
    dateTime={form?.dateTime ?? data.ascent.dateTime}
    filePaths={form?.filePaths ??
      (data.ascent.files.length === 0 ? undefined : data.ascent.files.map((file) => file.path))}
    gradeFk={form?.gradeFk ?? data.ascent.gradeFk}
    grades={data.grades}
    gradingScale={data.user?.userSettings?.gradingScale}
    notes={form?.notes ?? data.ascent.notes}
    type={form?.type ?? data.ascent.type}
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
          <i class="fa-solid fa-trash"></i>Delete ascent
        {/snippet}

        {#snippet content()}
          <article>
            <p>Are you sure you want to delete this ascent?</p>
          </article>

          <footer class="flex justify-end">
            <form method="POST" action="?/removeAscent" use:enhance>
              <button class="btn btn-sm preset-filled-error-500 !text-white" type="submit">Yes</button>
            </form>
          </footer>
        {/snippet}
      </Popover>

      <button class="btn preset-filled-primary-500" type="submit">Save ascent</button>
    </div>
  </div>
</form>
