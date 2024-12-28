<script lang="ts" generics="T extends { id: string | number, name: string, pathname: string }">
  import type { Snippet } from 'svelte'

  interface Props {
    items: T[]
    wrap?: boolean

    left: Snippet<[T]>
    leftClasses?: string

    right?: Snippet<[T]>
    rightContent?: (item: T) => string
    rightPathname?: (item: T) => string
  }

  const { items, wrap = true, left, leftClasses = 'anchor', right, rightContent, rightPathname }: Props = $props()
</script>

<nav class="list-nav">
  {#if items.length === 0}
    No items yet
  {:else}
    <ul class="overflow-auto">
      {#each items as item (item.id)}
        <li
          class="hover:preset-tonal-primary flex {wrap
            ? 'flex-wrap'
            : ''} justify-between whitespace-nowrap border-b-[1px] last:border-none border-surface-800 rounded"
        >
          <a
            class="
              {leftClasses}
              {wrap ? 'w-full' : 'w-1/2 sm:w-auto'}
              grow
              hover:text-white
              md:px-4
              md:w-auto
              overflow-hidden
              px-2
              py-3
              text-ellipsis
            "
            href={item.pathname}
          >
            {@render left(item)}
          </a>

          {#if rightContent != null}
            <a
              class="
                {wrap ? 'w-full' : 'w-1/2 sm:w-auto'}
                anchor
                hover:text-white
                md:px-4
                md:w-auto
                overflow-hidden
                px-2
                py-3
                text-ellipsis
              "
              href={rightPathname?.(item)}
            >
              {rightContent(item)}
            </a>
          {/if}

          {#if right != null}
            <div
              class="
              {wrap ? 'w-full' : 'shrink'}
              flex
              md:w-auto
              overflow-hidden
              text-ellipsis
            "
            >
              {@render right(item)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</nav>
