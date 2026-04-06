'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'

interface RatingsDisclaimerModalProps {
    onClose?: () => void
}

export function RatingsDisclaimerModal({ onClose }: RatingsDisclaimerModalProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Mount opened so it doesn't cause hydration mismatch
        setOpen(true)
    }, [])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-xl border border-accent/30 bg-surface-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-accent/20 bg-accent/5 px-6 py-4 rounded-t-xl">
                    <h2 className="text-lg font-bold text-accent flex items-center gap-2">
                        <span aria-hidden="true">⚠️</span> Important Instruction
                    </h2>
                </div>

                <div className="px-6 py-6 border-b border-border">
                    <p className="text-sm text-text-primary leading-relaxed">
                        Please rate players purely on how good they are at their specific position. For example, if Ronaldo is a 95 Striker, then Maldini is a 95 Defender—the best Defender in our squad should receive a similar score to our best Striker.
                    </p>
                    <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                        <p className="text-sm text-accent font-bold text-center">
                            Do not compare Strikers to Goalkeepers, or Defenders to Strikers etc.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center p-5 bg-surface-1 rounded-b-xl border-t border-accent/20">
                    <Button variant="primary" size="lg" className="w-full" onClick={() => {
                        setOpen(false)
                        if (onClose) onClose()
                    }}>
                        I understand
                    </Button>
                </div>
            </div>
        </div>
    )
}
