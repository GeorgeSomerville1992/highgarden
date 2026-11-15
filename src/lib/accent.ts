import type { CSSProperties } from 'react'
import type { Accent } from '../feeds/types.ts'

/** Sets `--accent` for a column. React applies it through the CSSOM, which the CSP allows. */
export function accentStyle(accent: Accent): CSSProperties {
  return { '--accent': `light-dark(${accent.light}, ${accent.dark})` } as CSSProperties
}
