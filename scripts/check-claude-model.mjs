#!/usr/bin/env node
/**
 * Check whether the Claude model pinned in lib/services/aiService.ts is
 * still live, and surface any deprecation date Anthropic has set.
 *
 * Run:  npm run check:model
 *
 * Exit codes:
 *   0  model is live, no deprecation flagged
 *   1  model is live but a deprecation_date is set (warning)
 *   2  model is retired / not found (hard error)
 *   3  request failed for unrelated reasons (e.g. missing API key)
 *
 * Wire into your build by adding 'npm run check:model && ...' to the
 * `build` script if you want a hard build-time gate. Skipped by default
 * because it adds a network call to every build and needs the API key.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SERVICE_PATH = join(__dirname, '..', 'lib', 'services', 'aiService.ts')

// Parse the pinned model from the single source of truth in aiService.ts
function readPinnedModel() {
  const src = readFileSync(SERVICE_PATH, 'utf8')
  const m = src.match(/export const CLAUDE_MODEL\s*=\s*['"]([^'"]+)['"]/)
  if (!m) {
    console.error('Could not find `export const CLAUDE_MODEL` in', SERVICE_PATH)
    process.exit(3)
  }
  return m[1]
}

async function main() {
  const model = readPinnedModel()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set in the environment.')
    console.error('Set it (or run via a shell that has it) and try again.')
    process.exit(3)
  }

  console.log(`→ Checking Claude model: ${model}`)
  const res = await fetch(`https://api.anthropic.com/v1/models/${model}`, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  })

  if (res.status === 404) {
    console.error()
    console.error('✖ Model is RETIRED or unknown.')
    console.error()
    console.error('  Update CLAUDE_MODEL in lib/services/aiService.ts.')
    console.error('  Current models: https://platform.claude.com/docs/en/about-claude/models/overview')
    console.error()
    process.exit(2)
  }

  if (!res.ok) {
    console.error(`✖ API returned ${res.status}: ${(await res.text()).slice(0, 200)}`)
    process.exit(3)
  }

  const info = await res.json()
  console.log(`✓ Model is live: ${info.display_name ?? info.id}`)
  if (info.created_at) console.log(`  Released:        ${info.created_at}`)
  if (info.deprecation_date) {
    console.error()
    console.error(`⚠ DEPRECATION SCHEDULED: ${info.deprecation_date}`)
    console.error('  Pick a replacement before this date to avoid a 404.')
    console.error('  Current models: https://platform.claude.com/docs/en/about-claude/models/overview')
    console.error()
    process.exit(1)
  }
  console.log('  No deprecation flagged. All good.')
}

main().catch((err) => {
  console.error('Unexpected error:', err.message)
  process.exit(3)
})
