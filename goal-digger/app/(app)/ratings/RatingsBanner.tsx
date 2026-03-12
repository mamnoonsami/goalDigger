'use client'

import { useState } from 'react'

export default function RatingsBanner() {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) return null

    return (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3 relative">
            <span className="text-accent mt-0.5" aria-hidden="true">⚠️</span>
            <div className="flex-1 pr-6">
                <p className="text-sm text-accent font-medium leading-relaxed">
                    Please rate honestly/fairly to help split the teams automatically in future. If you rated <b>100</b> to Messi and Ronaldo, how much would you rate your teammates?
                </p>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1.5 text-accent/60 hover:text-accent hover:bg-accent/20 rounded-md transition-colors"
                aria-label="Dismiss notice"
            >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    )
}
