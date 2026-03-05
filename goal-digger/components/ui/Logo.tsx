import { cn } from '../../lib/utils'

interface LogoProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
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
