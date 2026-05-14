'use client'

import { useState } from 'react'

// ── State shape data ─────────────────────────────────────────────────────────
// Albers USA projection, viewBox 0 0 960 600
// Alaska & Hawaii repositioned to lower-left / lower-center
// Paths are simplified polygon approximations of real state outlines

const STATE_PATHS: Record<string, string> = {
  AL: 'M 716 421 L 762 421 L 770 432 L 773 495 L 748 500 L 737 516 L 726 516 L 715 495 Z',
  AK: 'M 155 462 L 184 455 L 205 460 L 215 478 L 204 495 L 218 508 L 216 522 L 198 528 L 178 518 L 164 530 L 145 530 L 132 518 L 102 520 L 78 510 L 62 513 L 52 503 L 58 488 L 78 480 L 88 492 L 105 494 L 120 484 L 136 480 L 148 470 Z',
  AZ: 'M 206 374 L 305 374 L 372 374 L 378 496 L 290 495 L 237 513 L 207 490 Z',
  AR: 'M 558 393 L 660 390 L 665 396 L 663 455 L 648 459 L 558 459 Z',
  CA: 'M 58 430 L 72 468 L 84 491 L 93 490 L 114 468 L 133 440 L 158 408 L 186 370 L 202 340 L 208 312 L 212 280 L 208 250 L 200 218 L 184 188 L 148 168 L 120 155 L 87 149 L 62 180 L 60 230 L 58 300 Z',
  CO: 'M 285 280 L 453 278 L 455 360 L 285 362 Z',
  CT: 'M 848 161 L 893 155 L 897 177 L 898 198 L 860 200 L 848 190 Z',
  DC: 'M 822 305 L 835 298 L 843 308 L 830 318 Z',
  DE: 'M 837 263 L 858 255 L 867 268 L 862 300 L 848 302 L 836 290 Z',
  FL: 'M 702 480 L 758 477 L 800 474 L 845 476 L 855 490 L 856 516 L 845 545 L 828 572 L 810 588 L 792 596 L 776 590 L 770 574 L 752 562 L 740 542 L 726 518 L 714 505 L 702 498 Z',
  GA: 'M 705 425 L 762 421 L 775 432 L 780 436 L 800 436 L 808 451 L 810 474 L 800 474 L 758 477 L 702 480 L 700 468 L 695 445 Z',
  HI: 'M 197 490 L 210 488 L 220 496 L 218 510 L 204 514 L 195 506 Z M 225 494 L 240 490 L 252 498 L 248 510 L 234 512 L 224 505 Z M 255 488 L 271 484 L 284 492 L 280 505 L 265 508 L 254 500 Z M 290 482 L 308 476 L 322 482 L 322 498 L 306 504 L 290 498 Z M 330 478 L 348 473 L 356 480 L 350 495 L 334 498 L 326 490 Z',
  ID: 'M 205 62 L 258 56 L 300 60 L 315 80 L 308 120 L 304 160 L 305 210 L 285 250 L 260 255 L 248 240 L 240 200 L 236 140 L 240 100 Z',
  IL: 'M 617 210 L 670 208 L 694 215 L 696 252 L 692 280 L 690 316 L 684 340 L 665 340 L 647 330 L 630 340 L 614 340 L 610 315 L 608 270 L 615 240 Z',
  IN: 'M 668 210 L 728 208 L 730 260 L 725 310 L 712 320 L 694 315 L 692 280 L 696 252 L 694 215 Z',
  IA: 'M 524 210 L 617 210 L 615 240 L 608 270 L 590 295 L 556 296 L 524 292 L 516 275 L 518 240 Z',
  KS: 'M 426 294 L 574 292 L 575 364 L 426 366 Z',
  KY: 'M 644 300 L 694 298 L 730 300 L 774 302 L 776 312 L 775 328 L 756 340 L 730 345 L 712 320 L 694 315 L 665 340 L 648 340 L 635 330 L 630 316 L 638 308 Z',
  LA: 'M 572 460 L 648 459 L 663 455 L 672 465 L 678 480 L 666 492 L 672 510 L 660 522 L 640 528 L 620 530 L 600 525 L 582 510 L 572 495 L 568 478 Z',
  ME: 'M 845 28 L 870 20 L 900 22 L 910 40 L 905 70 L 895 100 L 875 108 L 855 100 L 840 80 L 838 55 Z',
  MD: 'M 776 278 L 832 268 L 858 255 L 867 268 L 862 300 L 848 302 L 836 290 L 820 296 L 810 302 L 790 305 L 776 295 Z',
  MA: 'M 838 150 L 883 140 L 908 145 L 915 160 L 912 175 L 898 178 L 893 155 L 860 160 L 845 168 Z M 908 152 L 925 155 L 930 165 L 918 172 L 908 165 Z',
  MI: 'M 658 120 L 688 108 L 726 108 L 765 116 L 775 140 L 765 168 L 740 175 L 718 172 L 698 165 L 675 165 L 658 155 Z M 700 175 L 732 170 L 760 180 L 772 205 L 770 235 L 752 250 L 730 255 L 714 248 L 704 235 L 700 210 Z',
  MN: 'M 526 65 L 565 60 L 610 62 L 655 60 L 660 85 L 658 120 L 658 155 L 618 165 L 580 168 L 555 168 L 536 180 L 524 195 L 520 165 L 515 135 L 518 100 Z',
  MS: 'M 636 421 L 715 421 L 726 516 L 726 530 L 714 535 L 695 528 L 680 505 L 668 485 L 650 465 L 636 455 Z',
  MO: 'M 545 295 L 590 295 L 608 270 L 610 315 L 614 340 L 630 340 L 638 360 L 636 390 L 558 393 L 540 390 L 535 368 L 540 340 L 545 315 Z',
  MT: 'M 236 55 L 515 52 L 515 198 L 456 200 L 455 185 L 285 187 L 250 175 L 236 148 Z',
  NE: 'M 412 207 L 568 207 L 574 292 L 426 294 L 410 280 L 408 245 Z',
  NV: 'M 130 184 L 208 185 L 212 250 L 208 312 L 196 340 L 182 368 L 130 340 L 128 290 L 125 240 Z',
  NH: 'M 828 73 L 855 68 L 858 80 L 862 110 L 860 145 L 848 161 L 845 148 L 838 150 L 832 130 L 828 100 Z',
  NJ: 'M 836 222 L 857 213 L 867 225 L 870 255 L 858 255 L 837 263 L 836 248 Z',
  NM: 'M 282 362 L 455 360 L 453 472 L 290 472 L 280 470 Z',
  NY: 'M 736 112 L 796 110 L 838 117 L 845 130 L 840 145 L 828 145 L 820 155 L 818 180 L 820 200 L 818 215 L 800 220 L 782 225 L 780 210 L 774 202 L 757 200 L 744 210 L 730 208 L 720 202 L 718 188 L 726 165 L 730 140 L 736 120 Z M 848 196 L 860 198 L 898 198 L 900 205 L 880 212 L 862 215 L 848 205 Z',
  NC: 'M 678 352 L 720 345 L 756 340 L 795 342 L 830 345 L 852 355 L 855 365 L 840 370 L 808 375 L 780 378 L 762 388 L 750 398 L 740 410 L 730 415 L 715 421 L 705 425 L 695 418 L 680 408 L 665 400 L 658 388 L 664 372 Z',
  ND: 'M 396 62 L 515 60 L 515 135 L 396 138 Z',
  OH: 'M 728 208 L 780 205 L 792 215 L 795 240 L 792 268 L 785 298 L 776 312 L 774 302 L 730 300 L 725 310 L 730 260 Z',
  OK: 'M 428 365 L 575 364 L 619 364 L 620 395 L 555 397 L 520 400 L 490 405 L 432 410 L 428 395 Z M 619 364 L 640 365 L 640 396 L 620 395 Z',
  OR: 'M 75 90 L 130 86 L 200 90 L 252 88 L 258 120 L 258 145 L 238 150 L 208 160 L 178 170 L 148 168 L 120 155 L 90 148 L 68 135 L 68 110 Z',
  PA: 'M 720 200 L 780 195 L 820 198 L 836 222 L 836 248 L 820 250 L 800 255 L 780 260 L 768 270 L 750 275 L 730 272 L 720 260 L 718 235 L 718 215 Z',
  RI: 'M 898 155 L 912 150 L 916 162 L 914 178 L 900 180 L 897 170 Z',
  SC: 'M 752 398 L 762 388 L 780 378 L 808 375 L 840 370 L 846 384 L 840 400 L 820 418 L 800 430 L 780 440 L 762 440 L 748 430 L 745 415 Z',
  SD: 'M 396 138 L 515 135 L 520 165 L 524 195 L 520 210 L 412 210 L 410 175 Z',
  TN: 'M 638 360 L 636 390 L 652 394 L 665 400 L 680 408 L 695 418 L 705 425 L 695 428 L 670 430 L 636 421 L 617 416 L 597 415 L 570 415 L 555 408 L 546 398 L 545 388 L 558 393 Z',
  TX: 'M 385 372 L 426 366 L 426 410 L 432 410 L 490 405 L 520 400 L 555 397 L 620 395 L 640 396 L 642 415 L 640 440 L 635 455 L 630 470 L 625 490 L 618 510 L 608 528 L 595 545 L 578 555 L 560 562 L 542 570 L 522 575 L 502 578 L 482 578 L 462 572 L 445 562 L 428 548 L 412 530 L 400 512 L 388 492 L 378 470 L 374 448 L 370 426 L 372 400 L 378 380 Z',
  UT: 'M 208 252 L 285 250 L 285 362 L 282 362 L 208 362 Z',
  VT: 'M 810 69 L 828 73 L 828 100 L 832 130 L 838 150 L 845 148 L 848 161 L 840 163 L 812 165 L 808 140 L 808 100 Z',
  VA: 'M 720 298 L 774 302 L 776 312 L 785 298 L 800 295 L 818 292 L 830 290 L 835 298 L 822 305 L 826 318 L 820 328 L 808 335 L 795 342 L 775 340 L 756 340 L 730 345 L 720 345 L 718 330 L 715 318 Z',
  WA: 'M 78 18 L 148 15 L 205 18 L 252 22 L 258 56 L 205 62 L 168 62 L 140 52 L 108 48 L 80 50 L 70 40 Z',
  WV: 'M 720 260 L 730 272 L 750 275 L 768 270 L 780 260 L 780 278 L 776 295 L 760 300 L 744 298 L 730 300 L 720 298 L 718 280 Z',
  WI: 'M 572 108 L 618 108 L 658 120 L 658 155 L 618 165 L 580 168 L 555 168 L 536 180 L 528 168 L 528 140 L 545 120 Z',
  WY: 'M 285 187 L 455 185 L 455 280 L 285 280 Z',
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'Washington D.C.', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

interface Props {
  selected?: string
  onSelect: (code: string) => void
}

export default function USStateMap({ selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const activeState = hovered ?? selected ?? null

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 960 600"
        className="w-full h-auto"
        style={{ maxHeight: 480 }}
        aria-label="Interactive US state map"
      >
        {Object.entries(STATE_PATHS).map(([code, d]) => {
          const isSelected = selected === code
          const isHovered = hovered === code

          return (
            <path
              key={code}
              d={d}
              onClick={() => onSelect(code)}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
              fill={
                isSelected
                  ? 'var(--accent)'
                  : isHovered
                  ? 'var(--accent-light)'
                  : 'var(--surface-secondary)'
              }
              stroke="var(--surface)"
              strokeWidth={isSelected || isHovered ? 1.5 : 1}
              opacity={isSelected ? 1 : isHovered ? 0.9 : 0.85}
            >
              <title>{STATE_NAMES[code] ?? code}</title>
            </path>
          )
        })}

        {/* State abbreviation labels for larger states */}
        {[
          ['MT', 375, 128], ['WY', 368, 232], ['CO', 368, 322], ['NM', 364, 418],
          ['AZ', 285, 435], ['UT', 246, 308], ['NV', 168, 262], ['CA', 130, 330],
          ['OR', 162, 155], ['WA', 162, 58],  ['ID', 252, 158], ['TX', 510, 478],
          ['OK', 528, 384], ['KS', 498, 330], ['NE', 488, 250], ['SD', 458, 172],
          ['ND', 454, 100], ['MN', 588, 130], ['WI', 614, 148], ['IA', 570, 254],
          ['MO', 590, 345], ['AR', 612, 427], ['LA', 626, 494], ['MS', 672, 478],
          ['IL', 653, 278], ['IN', 695, 260], ['OH', 756, 258], ['MI', 710, 155],
          ['KY', 706, 325], ['TN', 630, 398], ['AL', 737, 472], ['GA', 752, 455],
          ['FL', 770, 535], ['SC', 796, 412], ['NC', 755, 378], ['VA', 775, 320],
          ['WV', 748, 280], ['PA', 775, 235], ['NY', 780, 165],
        ].map(([code, x, y]) => (
          <text
            key={`label-${code}`}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fontWeight={600}
            fontFamily="var(--font-display, sans-serif)"
            fill={selected === code ? 'white' : 'var(--text-muted)'}
            pointerEvents="none"
            style={{ userSelect: 'none' }}
          >
            {code}
          </text>
        ))}
      </svg>

      {/* State name shown below map */}
      <p className="text-center text-xs text-[--text-muted] mt-1 h-5">
        {activeState ? (STATE_NAMES[activeState] ?? activeState) : ''}
      </p>
    </div>
  )
}
