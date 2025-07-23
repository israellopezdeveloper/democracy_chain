import { useEffect } from 'react'

export function useParallax() {
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0

      const back = document.querySelector('.parallax-layer.back') as HTMLElement
      const front = document.querySelector(
        '.parallax-layer.front'
      ) as HTMLElement

      if (back) back.style.transform = `translateY(${scrollPercent * -20}%)`
      if (front) front.style.transform = `translateY(${scrollPercent * 40}%)`
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Run initially

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}
