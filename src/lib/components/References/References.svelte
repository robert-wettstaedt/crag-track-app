<script lang="ts">
  import RouteName from '$lib/components/RouteName'
  import type { References } from '$lib/references.server'

  interface Props {
    references: References
  }

  let { references }: Props = $props()
</script>

<nav class="list-nav">
  <ul>
    {#each references.routes as route}
      <li>
        <a class="anchor px-4 py-3 flex hover:preset-tonal-primary" href={`/routes/${route.id}`}>
          <RouteName {route} />
        </a>
      </li>
    {/each}

    {#each references.areas as area}
      <li>
        <a class="anchor px-4 py-3 flex hover:preset-tonal-primary hover:text-white" href={`/areas/${area.id}`}>
          {area.name}
        </a>
      </li>
    {/each}

    {#each references.ascents as ascent}
      <li>
        <a
          class="anchor px-4 py-3 flex hover:preset-tonal-primary hover:text-white"
          href={`/routes/${ascent.route.id}`}
        >
          {ascent.author.username}'s tick of&nbsp;<RouteName route={ascent.route} />
        </a>
      </li>
    {/each}
  </ul>
</nav>
