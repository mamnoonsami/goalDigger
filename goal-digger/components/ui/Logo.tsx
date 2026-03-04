import { cn } from '../../lib/utils'

interface LogoProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
}

export function Logo({ size = 'md', className }: LogoProps) {
    return (
        <div
            className={cn(
                'flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden',
                sizeMap[size],
                className
            )}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/goalDiggerLogo.png"
                alt="Goal Digger"
                className="logo-themed object-contain w-full h-full"
            />
        </div>
    )
}
