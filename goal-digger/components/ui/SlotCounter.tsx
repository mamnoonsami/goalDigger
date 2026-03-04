'use client'

import { useEffect, useState } from 'react'

interface SlotCounterProps {
    value: number
    className?: string
    style?: React.CSSProperties
}

export function SlotCounter({ value, className, style }: SlotCounterProps) {
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        if (value === 0) return

        setDisplay(0)
        const duration = 1200
        const fps = 30
        const totalFrames = Math.round(duration / (1000 / fps))
        let frame = 0

        const timer = setInterval(() => {
            frame++
            const progress = frame / totalFrames
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(eased * value))

            if (frame >= totalFrames) {
                clearInterval(timer)
                setDisplay(value)
            }
        }, 1000 / fps)

        return () => clearInterval(timer)
    }, [value])

    return (
        <span className={className} style={style}>
            {display}
        </span>
    )
}
