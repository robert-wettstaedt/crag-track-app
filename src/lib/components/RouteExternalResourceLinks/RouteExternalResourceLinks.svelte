<script lang="ts">
  import Logo27crags from '$lib/assets/27crags-logo.png'
  import Logo8a from '$lib/assets/8a-logo.png'
  import LogoTheCrag from '$lib/assets/thecrag-logo.png'
  import type { InferResultType } from '$lib/db/types'

  export let iconSize: number
  export let showNotFoundIcon: boolean = false
  export let routeExternalResources:
    | InferResultType<
        'routeExternalResources',
        { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
      >
    | undefined

  $: notFound =
    routeExternalResources != null &&
    routeExternalResources.externalResource8a == null &&
    routeExternalResources.externalResource27crags == null &&
    routeExternalResources.externalResourceTheCrag == null
</script>

{#if routeExternalResources != null}
  <div class="flex gap-2">
    {#if routeExternalResources.externalResource8a?.url != null}
      <a class="btn btn-sm variant-ghost" href={routeExternalResources.externalResource8a.url} target="_blank">
        <img src={Logo8a} alt="The Crag" width={iconSize} height={iconSize} />
      </a>
    {/if}

    {#if routeExternalResources.externalResource27crags?.url != null}
      <a class="btn btn-sm variant-ghost" href={routeExternalResources.externalResource27crags.url} target="_blank">
        <img src={Logo27crags} alt="27crags" width={iconSize} height={iconSize} />
      </a>
    {/if}

    {#if routeExternalResources.externalResourceTheCrag?.url != null}
      <a class="btn btn-sm variant-ghost" href={routeExternalResources.externalResourceTheCrag.url} target="_blank">
        <img src={LogoTheCrag} alt="The Crag" width={iconSize} height={iconSize} />
      </a>
    {/if}

    {#if notFound && showNotFoundIcon}
      <i class="fa-solid fa-xmark px-3" />
    {/if}
  </div>
{/if}
