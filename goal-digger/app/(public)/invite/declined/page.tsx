import Link from 'next/link'
import { Button } from '../../../../components/ui/Button'

export default async function InviteDeclinedPage({
    searchParams,
}: {
    searchParams: Promise<{ match?: string }>
}) {
    const params = await searchParams
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
            
            <h1 className="text-3xl font-bold text-text-primary mb-3">You'll be missed!</h1>
            <p className="text-text-muted max-w-md mb-8">
                Thanks for letting us know. We hope to see you at the next one! ⚽
            </p>

            <div className="flex gap-4">
                <Link href={`/matches/${params.match || ''}`}>
                    <Button>View Match Details</Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="ghost">Go to Dashboard</Button>
                </Link>
            </div>
        </div>
    )
}
