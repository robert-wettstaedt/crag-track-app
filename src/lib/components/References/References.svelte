<script lang="ts">
  import RouteName from '$lib/components/RouteName'
  import type { Grade, UserSettings } from '$lib/db/schema'
  import type { References } from '$lib/references.server'

  export let references: References

  export let grades: Grade[]
  export let gradingScale: UserSettings['gradingScale'] | undefined
</script>

<nav class="list-nav">
  <ul>
    {#each references.routes as route}
      <li>
        <a href={`/routes/${route.id}`}>
          <RouteName {route} {grades} {gradingScale} />
        </a>
      </li>
    {/each}

    {#each references.areas as area}
      <li>
        <a href={`/areas/${area.id}`}>
          {area.name}
        </a>
      </li>
    {/each}

    {#each references.ascents as ascent}
      <li>
        <a href={`/routes/${ascent.route.id}`}>
          {ascent.author.userName}'s tick of&nbsp;<RouteName route={ascent.route} {grades} {gradingScale} />
        </a>
      </li>
    {/each}
  </ul>
</nav>
