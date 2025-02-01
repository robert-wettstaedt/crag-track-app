import * as schema from '$lib/db/schema'
import { convertMarkdownToHtml } from '$lib/markdown'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { describe, expect, it, vi } from 'vitest'

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({ where: vi.fn(() => [{ name: 'foo' }]) })),
  })),
} as unknown as PostgresJsDatabase<typeof schema>

describe('Markdown Conversion', () => {
  it('should convert basic markdown to HTML', async () => {
    const markdown = '# Heading\n\nParagraph text'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('<h1>Heading</h1>')
    expect(html).toContain('<p>Paragraph text</p>')
  })

  it('should handle emphasis and strong text', async () => {
    const markdown = '*italic* and **bold** text'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('should handle links', async () => {
    const markdown = '[Link text](https://example.com)'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('<a href="https://example.com">Link text</a>')
  })

  it('should handle null input', async () => {
    const html = await convertMarkdownToHtml(null)
    expect(html).toBe('')
  })

  it('should handle undefined input', async () => {
    const html = await convertMarkdownToHtml(undefined)
    expect(html).toBe('')
  })

  it('should handle whitespace-only input', async () => {
    const html = await convertMarkdownToHtml('   \n   \t   ')
    expect(html).toBe('')
  })

  it('should handle mentions', async () => {
    const markdown = '@username mentioned something'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('<a href="/users/username"><strong>@username</strong></a>')
  })

  it('should handle multiple mentions', async () => {
    const markdown = '@user1 and @user2 are collaborating'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('<a href="/users/user1"><strong>@user1</strong></a>')
    expect(html).toContain('<a href="/users/user2"><strong>@user2</strong></a>')
  })

  it('should handle mentions in formatted text', async () => {
    const markdown = '**@user** wrote in *@group*'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('<strong><a href="/users/user"><strong>@user</strong></a></strong>')
    expect(html).toContain('<em><a href="/users/group"><strong>@group</strong></a></em>')
  })

  it('should handle references without db', async () => {
    const markdown = '!routes:123!'
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toContain('!routes:123!')
  })

  it('should handle areas references', async () => {
    const markdown = '!areas:123!'
    const html = await convertMarkdownToHtml(markdown, mockDb)
    expect(html).toContain('<a href="/areas/123"><strong>foo</strong></a>')
  })

  it('should handle blocks references', async () => {
    const markdown = '!blocks:123!'
    const html = await convertMarkdownToHtml(markdown, mockDb)
    expect(html).toContain('<a href="/blocks/123"><strong>foo</strong></a>')
  })

  it('should handle routes references', async () => {
    const markdown = '!routes:123!'
    const html = await convertMarkdownToHtml(markdown, mockDb)
    expect(html).toContain('<a href="/routes/123"><strong>foo</strong></a>')
  })

  it('should handle missing references', async () => {
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(() => []) })),
      })),
    } as unknown as PostgresJsDatabase<typeof schema>

    const markdown = '!routes:123!'
    const html = await convertMarkdownToHtml(markdown, mockDb)
    expect(html).toContain('!routes:123!')
  })

  it('should handle malformed references', async () => {
    const markdown = '!routes:foo!'
    const html = await convertMarkdownToHtml(markdown, mockDb)
    expect(html).toContain('!routes:foo!')
  })

  it('should handle routes references with special characters', async () => {
    const markdown = '!routes:123!!'
    const html = await convertMarkdownToHtml(markdown, mockDb)
    expect(html).toContain('<a href="/routes/123"><strong>foo</strong></a>!')
  })

  it('should handle throwing db', async () => {
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            throw new Error()
          }),
        })),
      })),
    } as unknown as PostgresJsDatabase<typeof schema>

    const markdown = '!routes:123!!'
    expect(convertMarkdownToHtml(markdown, mockDb)).rejects.toThrowError()
  })
})
