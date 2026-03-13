import Link from 'next/link'
import { Button } from '../../../../components/ui/Button'

export default function InviteSuccessPage({
    searchParams,
}: {
    searchParams: { match?: string }
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6 text-accent animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            
            <h1 className="text-3xl font-bold text-text-primary mb-3">You're in!</h1>
            <p className="text-text-muted max-w-md mb-8">
                You have successfully been added to the match roster. You can safely close this window or log in to view the match details.
            </p>

            <div className="flex gap-4">
                <Link href={`/matches/${searchParams.match || ''}`}>
                    <Button>View Match Details</Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="ghost">Go to Dashboard</Button>
                </Link>
            </div>
        </div>
    )
}
