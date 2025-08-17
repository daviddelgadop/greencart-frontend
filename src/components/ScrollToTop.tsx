import { useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

type Props = {
  children?: ReactNode
  behavior?: ScrollBehavior
  containerSelector?: string
}

export default function ScrollToTop({ children, behavior = 'instant', containerSelector }: Props) {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const el = containerSelector ? document.querySelector(containerSelector) as HTMLElement | null : null
    if (el?.scrollTo) {
      el.scrollTo({ top: 0, left: 0, behavior })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior })
    }
  }, [pathname, search, containerSelector, behavior])

  return <>{children}</>
}
