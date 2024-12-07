<script lang="ts" generics="T extends { id: string | number, name: string, pathname: string }">
  import type { Snippet } from 'svelte'

  interface Props {
    items: T[]

    left: Snippet<[T]>
    leftClasses?: string

    right?: Snippet<[T]>
    rightContent?: (item: T) => string
    rightPathname?: (item: T) => string
  }

  const { items, left, leftClasses = 'anchor', right, rightContent, rightPathname }: Props = $props()
</script>

<nav class="list-nav">
  {#if items.length === 0}
    No items yet
  {:else}
    <ul class="overflow-auto">
      {#each items as item (item.id)}
        <li
          class="hover:preset-tonal-primary flex flex-wrap justify-between whitespace-nowrap border-b-[1px] border-surface-800 rounded"
        >
          <a
            class="{leftClasses} px-2 md:px-4 py-3 grow overflow-hidden text-ellipsis hover:text-white w-full md:w-auto"
            href={item.pathname}
          >
            {@render left(item)}
          </a>

          {#if rightContent != null}
            <a
              class="anchor px-2 md:px-4 py-3 overflow-hidden text-ellipsis hover:text-white w-full md:w-auto"
              href={rightPathname?.(item)}
            >
              {rightContent(item)}
            </a>
          {/if}

          {#if right != null}
            <div class="flex overflow-hidden text-ellipsis w-full md:w-auto">
              {@render right(item)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</nav>
