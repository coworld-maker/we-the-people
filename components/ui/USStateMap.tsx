'use client'

import { useState } from 'react'

interface StateTile {
  code: string
  name: string
  row: number
  col: number
}

const TILES: StateTile[] = [
  // Row 0
  { code: 'AK', name: 'Alaska',          row: 0, col: 0  },
  { code: 'ME', name: 'Maine',            row: 0, col: 11 },
  // Row 1
  { code: 'WA', name: 'Washington',       row: 1, col: 0  },
  { code: 'MT', name: 'Montana',          row: 1, col: 1  },
  { code: 'ND', name: 'North Dakota',     row: 1, col: 2  },
  { code: 'MN', name: 'Minnesota',        row: 1, col: 3  },
  { code: 'WI', name: 'Wisconsin',        row: 1, col: 6  },
  { code: 'MI', name: 'Michigan',         row: 1, col: 7  },
  { code: 'VT', name: 'Vermont',          row: 1, col: 9  },
  { code: 'NH', name: 'New Hampshire',    row: 1, col: 10 },
  // Row 2
  { code: 'OR', name: 'Oregon',           row: 2, col: 0  },
  { code: 'ID', name: 'Idaho',            row: 2, col: 1  },
  { code: 'WY', name: 'Wyoming',          row: 2, col: 2  },
  { code: 'SD', name: 'South Dakota',     row: 2, col: 3  },
  { code: 'IA', name: 'Iowa',             row: 2, col: 5  },
  { code: 'IL', name: 'Illinois',         row: 2, col: 6  },
  { code: 'OH', name: 'Ohio',             row: 2, col: 7  },
  { code: 'PA', name: 'Pennsylvania',     row: 2, col: 8  },
  { code: 'NY', name: 'New York',         row: 2, col: 9  },
  { code: 'MA', name: 'Massachusetts',    row: 2, col: 10 },
  // Row 3
  { code: 'CA', name: 'California',       row: 3, col: 0  },
  { code: 'NV', name: 'Nevada',           row: 3, col: 1  },
  { code: 'UT', name: 'Utah',             row: 3, col: 2  },
  { code: 'CO', name: 'Colorado',         row: 3, col: 3  },
  { code: 'NE', name: 'Nebraska',         row: 3, col: 4  },
  { code: 'IN', name: 'Indiana',          row: 3, col: 6  },
  { code: 'WV', name: 'West Virginia',    row: 3, col: 7  },
  { code: 'VA', name: 'Virginia',         row: 3, col: 8  },
  { code: 'MD', name: 'Maryland',         row: 3, col: 9  },
  { code: 'DE', name: 'Delaware',         row: 3, col: 10 },
  { code: 'NJ', name: 'New Jersey',       row: 3, col: 11 },
  // Row 4
  { code: 'AZ', name: 'Arizona',          row: 4, col: 1  },
  { code: 'NM', name: 'New Mexico',       row: 4, col: 2  },
  { code: 'KS', name: 'Kansas',           row: 4, col: 4  },
  { code: 'MO', name: 'Missouri',         row: 4, col: 5  },
  { code: 'KY', name: 'Kentucky',         row: 4, col: 6  },
  { code: 'TN', name: 'Tennessee',        row: 4, col: 7  },
  { code: 'NC', name: 'North Carolina',   row: 4, col: 8  },
  { code: 'SC', name: 'South Carolina',   row: 4, col: 9  },
  { code: 'CT', name: 'Connecticut',      row: 4, col: 10 },
  { code: 'RI', name: 'Rhode Island',     row: 4, col: 11 },
  // Row 5
  { code: 'OK', name: 'Oklahoma',         row: 5, col: 4  },
  { code: 'AR', name: 'Arkansas',         row: 5, col: 5  },
  { code: 'MS', name: 'Mississippi',      row: 5, col: 7  },
  { code: 'AL', name: 'Alabama',          row: 5, col: 8  },
  { code: 'GA', name: 'Georgia',          row: 5, col: 9  },
  { code: 'DC', name: 'Washington D.C.',  row: 5, col: 10 },
  // Row 6
  { code: 'HI', name: 'Hawaii',           row: 6, col: 1  },
  { code: 'TX', name: 'Texas',            row: 6, col: 4  },
  { code: 'LA', name: 'Louisiana',        row: 6, col: 5  },
  { code: 'FL', name: 'Florida',          row: 6, col: 9  },
]

const ROWS = 7
const COLS = 12

interface Props {
  selected?: string
  onSelect: (code: string) => void
}

export default function USStateMap({ selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Build lookup: "row-col" → tile
  const tileMap = new Map(TILES.map(t => [`${t.row}-${t.col}`, t]))
  const hoveredTile = hovered ? TILES.find(t => t.code === hovered) : null

  return (
    <div className="w-full">
      {/* Overflow container for small screens */}
      <div className="overflow-x-auto pb-1">
        <div
          className="mx-auto"
          style={{ minWidth: 340, maxWidth: 560 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
              gap: 3,
            }}
          >
            {Array.from({ length: ROWS }, (_, row) =>
              Array.from({ length: COLS }, (_, col) => {
                const tile = tileMap.get(`${row}-${col}`)
                const key = `${row}-${col}`

                if (!tile) {
                  return <div key={key} style={{ aspectRatio: '1/1' }} />
                }

                const isSelected = selected === tile.code
                const isHovered = hovered === tile.code

                return (
                  <button
                    key={key}
                    onClick={() => onSelect(tile.code)}
                    onMouseEnter={() => setHovered(tile.code)}
                    onMouseLeave={() => setHovered(null)}
                    title={tile.name}
                    aria-label={tile.name}
                    style={{ aspectRatio: '1/1' }}
                    className={`
                      flex items-center justify-center rounded
                      font-display font-bold text-[9px] sm:text-[10px]
                      transition-all duration-100 focus:outline-none
                      focus-visible:ring-2 focus-visible:ring-[--accent]
                      ${isSelected
                        ? 'bg-[--accent] text-white shadow-md shadow-[--accent]/30 scale-105 z-10'
                        : isHovered
                        ? 'bg-[--accent-light] text-[--accent] scale-105 z-10'
                        : 'bg-[--surface-secondary] text-[--text-secondary] hover:bg-[--accent-light] hover:text-[--accent]'}
                    `}
                  >
                    {tile.code}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* State name tooltip below map */}
      <p className="text-center text-xs text-[--text-muted] mt-2 h-4 transition-opacity">
        {hoveredTile ? hoveredTile.name : selected ? TILES.find(t => t.code === selected)?.name ?? '' : ''}
      </p>
    </div>
  )
}
