import 'dragula/dist/dragula.css'
import type { Action } from 'svelte/action'

type DraggableAction<T extends { id: string | number }> = Action<
  HTMLElement,
  T[] | null | undefined,
  {
    onconsider: (items: CustomEvent<T[]>) => void
    onfinish: (items: CustomEvent<T[]>) => void
  }
>

export const draggable = <T extends { id: string | number }>(
  ...args: Parameters<DraggableAction<T>>
): ReturnType<DraggableAction<T>> => {
  const [node] = args
  let [, items] = args

  let scrollable = true

  const listener: EventListener = (event) => {
    if (!scrollable) {
      event.preventDefault()
    }
  }

  // https://github.com/bevacqua/dragula/issues/487
  document.addEventListener('touchmove', listener, { passive: false })

  // https://github.com/bevacqua/dragula/issues/602
  globalThis.global = globalThis

  import('dragula').then(({ default: dragula }) => {
    dragula([node], {
      copy: true,
      accepts: (el, container, handle, sibling) => {
        if (items == null) {
          return false
        }

        const id = el?.attributes.getNamedItem('data-id')?.value
        const siblingId = sibling?.attributes.getNamedItem('data-id')?.value

        const item = items?.find((item) => String(item.id) === id)
        const siblingItem = items?.find((item) => String(item.id) === siblingId)

        if (item != null && item.id !== siblingItem?.id) {
          const sortedItems = items.slice()
          const itemIndex = sortedItems.findIndex((i) => i.id === item.id)
          const siblingIndex = sortedItems.findIndex((i) => i.id === siblingItem?.id)
          sortedItems.splice(itemIndex, 1)

          if (itemIndex > -1 && siblingIndex > -1) {
            sortedItems.splice(siblingIndex - 1, 0, item)
          } else {
            sortedItems.push(item)
          }

          node.dispatchEvent(new CustomEvent('consider', { detail: sortedItems }))
        }

        return true
      },
    })
      .on('drag', function () {
        scrollable = false
      })
      .on('drop', function () {
        if (items == null) {
          return
        }

        const children = Array.from(node.children).map((child) => child.attributes.getNamedItem('data-id')?.value)
        const sortedItems = items?.toSorted((a, b) => {
          const aIndex = children.indexOf(String(a.id))
          const bIndex = children.indexOf(String(b.id))
          return aIndex - bIndex
        })

        node.dispatchEvent(new CustomEvent('finish', { detail: sortedItems }))

        scrollable = true
      })
  })

  return {
    update(newItems) {
      const every = newItems?.every((newItem, index) => items?.[index]?.id === newItem.id)

      if (!every) {
        items = newItems

        Array.from(node.children).forEach((child, index) => {
          const item = items?.[index]

          if (item != null) {
            const attr = document.createAttribute('data-id')
            attr.value = String(item.id)
            child.attributes.setNamedItem(attr)
          }
        })
      }
    },
  }
}
