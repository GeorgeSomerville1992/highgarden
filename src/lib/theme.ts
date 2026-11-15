import type { Theme } from '../storage/storage.ts'

/** No data-theme follows the OS (tokens.css); "light" or "dark" overrides it. */
export function applyTheme(theme: Theme): void {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
}
