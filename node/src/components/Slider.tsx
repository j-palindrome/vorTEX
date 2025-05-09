import { useEffect, useRef, useState } from 'react'
import { getters, useAppStore } from '../store'
import { lerp } from 'three/src/math/MathUtils'

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
  let moved = useRef<false | number>(false)
  const updateMouse = (ev: React.MouseEvent | React.TouchEvent) => {
    const rect = divRef.current!.getBoundingClientRect()
    let x: number, y: number

    if (ev.type === 'touchmove') {
      const touch = [...ev.touches].find(
        x =>
          x.clientX > rect.left &&
          x.clientX < rect.right &&
          x.clientY < rect.bottom &&
          x.clientY > rect.top
      )
      if (!touch) return
      x = (touch.clientX - rect.x) / rect.width
      y = 1 - (touch.clientY - rect.y) / rect.height
    } else if (ev.type === 'mousemove') {
      if (!ev.buttons) return
      x = (ev.clientX - rect.x) / rect.width
      y = 1 - (ev.clientY - rect.y) / rect.height
    } else throw new Error()

    place.current = { x, y }
    onChange({ x: x ** 2, y: y ** 2 })

    Object.assign(slider.current.style, sliderStyle({ x, y }))
  }
  const onMouseMove = ev => {
    if (!ev.buttons) return
    if (moved.current) window.clearTimeout(moved.current)
    moved.current = window.setTimeout(() => (moved.current = false), 200)
    updateMouse(ev)
  }

  const fadeTime = useAppStore(state => state.fadeTime)
  return (
    <div
      ref={divRef}
      className={`${className} relative flex overflow-hidden`}
      onTouchMove={updateMouse}
      onMouseMove={updateMouse}
      onMouseUp={ev => {
        if (moved.current) {
          return
        }
        const rect = ev.currentTarget.getBoundingClientRect()
        const x =
          ((ev['touches'] ? ev.touches[0].clientX : ev.clientX) - rect.x) /
          rect.width
        const y =
          1 -
          ((ev['touches'] ? ev.touches[0].clientY : ev.clientY) - rect.y) /
            rect.height

        const lastY = place.current.y
        place.current = { x, y }

        if (divRef.current!.getBoundingClientRect().bottom < ev.clientY + 30) {
          place.current = { x, y: 0 }
        }

        if (fadeTime > 0) {
          const transitionTo = (progress: number) => {
            const thisY = lerp(lastY, y, progress)
            onChange({ x: place.current.x ** 2, y: thisY ** 2 }, true)

            if (progress < 1) {
              requestAnimationFrame(() =>
                transitionTo(progress + 1 / 60 / fadeTime)
              )
            }
          }
          transitionTo(0)
        } else {
          onChange({ x: place.current.x ** 2, y: place.current.y ** 2 }, true)
        }
      }}>
      <div className={`${innerClassName} absolute`} ref={slider}></div>
    </div>
  )
}
