import { describe, it, expect } from 'vitest'
import { parseRssDocument } from '@/lib/api/rss'

const FEED = { name: 'Test Wire', lean: 'center' as const }

describe('parseRssDocument', () => {
  it('parses a basic RSS item and keeps congressional ones', () => {
    const xml = `<rss><channel>
      <item>
        <title>Senate passes major appropriations bill</title>
        <link>https://example.com/a</link>
        <description>The Senate voted today on legislation.</description>
        <pubDate>Wed, 18 Jun 2026 01:00:00 GMT</pubDate>
      </item>
    </channel></rss>`
    const out = parseRssDocument(xml, FEED)
    expect(out).toHaveLength(1)
    expect(out[0].title).toBe('Senate passes major appropriations bill')
    expect(out[0].url).toBe('https://example.com/a')
    expect(out[0].source).toBe('Test Wire')
    expect(out[0].lean).toBe('center')
  })

  it('filters out non-congressional items', () => {
    const xml = `<rss><channel>
      <item><title>Local weather forecast for the weekend</title>
      <link>https://example.com/w</link>
      <description>Sunny skies ahead.</description></item>
    </channel></rss>`
    expect(parseRssDocument(xml, FEED)).toHaveLength(0)
  })

  it('decodes CDATA and HTML entities in titles', () => {
    const xml = `<rss><channel>
      <item>
        <title><![CDATA[House &amp; Senate clash over the bill]]></title>
        <link>https://example.com/c</link>
      </item>
    </channel></rss>`
    const out = parseRssDocument(xml, FEED)
    expect(out[0].title).toBe('House & Senate clash over the bill')
  })

  it('parses Atom entries with href links', () => {
    const xml = `<feed>
      <entry>
        <title>Congress debates filibuster reform</title>
        <link href="https://example.com/atom" rel="alternate"/>
        <updated>2026-06-18T01:00:00Z</updated>
      </entry>
    </feed>`
    const out = parseRssDocument(xml, FEED)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://example.com/atom')
  })

  it('skips items missing a title or link', () => {
    const xml = `<rss><channel>
      <item><title>Congress acts</title></item>
      <item><link>https://example.com/x</link><description>legislation</description></item>
    </channel></rss>`
    expect(parseRssDocument(xml, FEED)).toHaveLength(0)
  })
})
