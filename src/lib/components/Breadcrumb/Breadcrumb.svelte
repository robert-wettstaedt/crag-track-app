<script lang="ts">
  import { run } from 'svelte/legacy'

  interface Props {
    url: URL
  }

  let { url }: Props = $props()

  interface Crumb {
    href: string
    label: string
  }

  let crumbs: Crumb[] = $state([])

  run(() => {
    // Remove zero-length tokens.
    const tokens = url.pathname.split('/').filter((token) => token !== '')

    // Create { label, href } pairs for each token.
    let tokenPath = ''
    crumbs = tokens
      .map((token): Crumb => {
        tokenPath += '/' + token
        return {
          label: token,
          href: tokenPath,
        }
      })
      .filter((crumb) => crumb.label !== '_')

    // Add a way to get home too.
    crumbs.unshift({ label: 'home', href: '/' })
  })
</script>

{#if crumbs.length > 2}
  <ol class="flex items-center gap-4 mb-8">
    {#each crumbs as crumb, i}
      <li>
        <a class="anchor" href={crumb.href}>{crumb.label}</a>
      </li>

      {#if i < crumbs.length - 1}
        <li class="opacity-50" aria-hidden="true">/</li>
      {/if}
    {/each}
  </ol>
{/if}
