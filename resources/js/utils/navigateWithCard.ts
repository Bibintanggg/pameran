import { router } from "@inertiajs/react"

export function navigateWithCard(href: string, activeCardId?: string | number | null) {
  if (!activeCardId) {
    router.visit(href)
    return
  }

  const url = new URL(href, window.location.origin)
  url.searchParams.set("card", String(activeCardId))

  router.visit(url.pathname + url.search)
}
