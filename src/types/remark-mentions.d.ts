declare module 'remark-mentions' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  interface Options {
    usernameLink: (username: string) => string
  }

  const remarkPing: Plugin<[(Readonly<Options> | null | undefined)?], Root, string>
  export default remarkPing
}
