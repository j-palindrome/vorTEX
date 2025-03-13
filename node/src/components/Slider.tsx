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
  sliderStyle,
  min,
  max
}: React.PropsWithChildren & {
  className?: string
  innerClassName?: string
  sliderStyle: ({ x, y }: { x: number; y: number }) => React.CSSProperties
  onChange: ({ x, y }: { x: number; y: number }, end?: boolean) => void
  values: { x: number; y: number }
  min: number
  max: number
}) {
  const slider = useRef<HTMLDivElement>(null!)
  const place = useRef<{ x: number; y: number }>(values)

  useEffect(() => {
    if (!slider.current) return
    place.current = values
    Object.assign(slider.current.style, sliderStyle(place.current))
  }, [values])

  const updateMouse = (ev: React.MouseEvent) => {
    const rect = ev.currentTarget.getBoundingClientRect()
    console.log('rect', rect.height)

    const x = (ev.clientX - rect.x) / rect.width
    const y = 1 - (ev.clientY - rect.y) / rect.height
    place.current = { x, y }
    onChange({ x, y })
    Object.assign(slider.current.style, sliderStyle({ x, y }))
  }

  return (
    <div
      className={`${className} relative h-full w-full flex overflow-hidden`}
      onMouseMove={ev => {
        if (!ev.buttons) return
        updateMouse(ev)
      }}
      onMouseUp={() => onChange(place.current, true)}
      onMouseLeave={() => onChange(place.current, true)}>
      <div className={`${innerClassName} absolute`} ref={slider}></div>
    </div>
  )
}
