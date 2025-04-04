import { useEffect, useRef, useState } from 'react'

/**
 * onChange returns style which is applied to the slider
 */
export default function Slider({
  children,
  className,
  innerClassName,
  onChange,
  values,
  sliderStyle
}: React.PropsWithChildren & {
  className?: string
  innerClassName?: string
  sliderStyle: ({ x, y }: { x: number; y: number }) => React.CSSProperties
  onChange: ({ x, y }: { x: number; y: number }, end?: boolean) => void
  values: { x: number; y: number }
}) {
  const slider = useRef<HTMLDivElement>(null!)
  const place = useRef<{ x: number; y: number }>(values)

  useEffect(() => {
    if (!slider.current) return
    place.current = { x: values.x ** 0.5, y: values.y ** 0.5 }
    Object.assign(slider.current.style, sliderStyle(place.current))
  }, [values])

  const divRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!divRef.current) return
    const updateMouse = (ev: React.MouseEvent | React.TouchEvent) => {
      const rect = ev.currentTarget.getBoundingClientRect()
      const x =
        ((ev['touches'] ? ev.touches[0].clientX : ev.clientX) - rect.x) /
        rect.width
      const y =
        1 -
        ((ev['touches'] ? ev.touches[0].clientY : ev.clientY) - rect.y) /
          rect.height
      place.current = { x, y }
      onChange({ x: x ** 2, y: y ** 2 })
      Object.assign(slider.current.style, sliderStyle({ x, y }))
    }
    const onMouseMove = ev => {
      if (!ev.buttons) return
      updateMouse(ev)
    }
    divRef.current.addEventListener('mousemove', onMouseMove, {
      passive: false
    })
    const onTouchMove = ev => {
      ev.preventDefault()
      updateMouse(ev)
    }
    divRef.current.addEventListener('touchmove', onTouchMove, {
      passive: false
    })
  }, [divRef.current])

  return (
    <div
      ref={divRef}
      className={`${className} relative flex overflow-hidden`}
      onMouseDown={ev => {
        const rect = ev.currentTarget.getBoundingClientRect()
        const x =
          ((ev['touches'] ? ev.touches[0].clientX : ev.clientX) - rect.x) /
          rect.width
        const y =
          1 -
          ((ev['touches'] ? ev.touches[0].clientY : ev.clientY) - rect.y) /
            rect.height
        place.current = { x, y }
        if (ev.currentTarget.getBoundingClientRect().bottom < ev.clientY + 20) {
          onChange({ y: 0, x: place.current.x })
        } else {
          onChange({ x: place.current.x ** 2, y: place.current.y ** 2 }, true)
        }
      }}>
      <div className={`${innerClassName} absolute`} ref={slider}></div>
    </div>
  )
}
