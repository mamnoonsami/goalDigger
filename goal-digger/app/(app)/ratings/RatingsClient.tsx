'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { submitAllRatings, publishRatings } from '../../actions/ratings'
import { Card } from '../../../components/ui/Card'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { useToast } from '../../../components/providers/ToastProvider'
import { RatingsDisclaimerModal } from './RatingsDisclaimerModal'

interface Player {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    player_position: string | null
}

interface Rating {
    ratee_id: string
    rating: number
}

interface RatingsClientProps {
    players: Player[]
    myRatings: Rating[]
    isAdmin?: boolean
}

export default function RatingsClient({ players, myRatings, isAdmin }: RatingsClientProps) {
    const toast = useToast()
    const [activeTab, setActiveTab] = useState('striker')
    const [disclaimerClosed, setDisclaimerClosed] = useState(false)
    const [hasSwitchedTabs, setHasSwitchedTabs] = useState(false)
    // Keep local state for responsive UI
    const [localRatings, setLocalRatings] = useState<Record<string, number>>(() => {
        const acc: Record<string, number> = {}
        myRatings.forEach(r => {
            acc[r.ratee_id] = r.rating
        })
        return acc
    })
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const router = useRouter()

    const handlePublish = async () => {
        if (!confirm('Are you sure you want to publish these ratings to all player profiles? This will calculate the average of all submitted ratings.')) return;
        
        setIsPublishing(true)
        try {
            const result = await publishRatings()
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Successfully published ratings to ${result.count} players!`)
            }
        } catch (err) {
            toast.error('Failed to publish ratings')
        } finally {
            setIsPublishing(false)
        }
    }

    // Determine if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        for (const player of players) {
            const currentVal = localRatings[player.id] ?? 30
            const savedVal = myRatings.find(r => r.ratee_id === player.id)?.rating ?? 30
            if (currentVal !== savedVal) {
                return true
            }
        }
        return false
    }, [localRatings, players, myRatings])

    // Native browser prompt when closing tab / refreshing
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    // Intercept navigation from Sidebar (we assume users use the sidebar links mostly)
    // In Next 13+ App Router, there's no native router event blocking.
    // We will attach click listeners to all links just for this page.
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest('a')

            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin) && !anchor.href.includes('/ratings')) {
                if (hasUnsavedChanges) {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowUnsavedPrompt(true)
                    // Store the intended destination to navigate later if they discard
                    sessionStorage.setItem('pendingRatingsNav', anchor.href)
                }
            }
        }

        document.addEventListener('click', handleClick, { capture: true })
        return () => document.removeEventListener('click', handleClick, { capture: true })
    }, [hasUnsavedChanges])

    const handleSliderChange = (playerId: string, value: number) => {
        setLocalRatings(prev => ({
            ...prev,
            [playerId]: value
        }))
    }

    const handleSaveAll = async () => {
        // Collect ratings for all players, defaulting to 30 if unmodified
        const ratingsArray = players.map(player => ({
            rateeId: player.id,
            rating: localRatings[player.id] ?? 30
        }))

        if (ratingsArray.length === 0) {
            toast.warning('No ratings to save')
            return
        }

        setIsSavingAll(true)
        try {
            const result = await submitAllRatings(ratingsArray)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('All ratings saved successfully!')
            }
        } catch (err) {
            toast.error('Failed to save ratings')
        } finally {
            setIsSavingAll(false)

            // If they were trying to navigate away, complete the navigation
            const pendingNav = sessionStorage.getItem('pendingRatingsNav')
            if (pendingNav) {
                sessionStorage.removeItem('pendingRatingsNav')
                router.push(pendingNav)
            } else {
                setShowUnsavedPrompt(false)
            }
        }
    }

    const handleDiscardAndNavigate = () => {
        // Reset local ratings to match saved ones to instantly clear 'unsaved' state
        const reset: Record<string, number> = {}
        myRatings.forEach(r => {
            reset[r.ratee_id] = r.rating
        })
        setLocalRatings(reset)
        setShowUnsavedPrompt(false)

        const pendingNav = sessionStorage.getItem('pendingRatingsNav')
        if (pendingNav) {
            sessionStorage.removeItem('pendingRatingsNav')
            router.push(pendingNav) // soft navigation, prevents native popup
        }
    }

    return (
        <div className="flex flex-col gap-6 pb-20">
            <RatingsDisclaimerModal onClose={() => setDisclaimerClosed(true)} />
            <div className="flex justify-between items-center bg-surface-1 sticky top-16 z-10 py-2 border-b border-border">
                <p className="text-sm text-text-muted">
                    {players.length} players to rate
                </p>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button
                            onClick={handlePublish}
                            isLoading={isPublishing}
                            disabled={isSavingAll || isPublishing}
                            variant="ghost"
                            size="md"
                        >
                            Publish Results
                        </Button>
                    )}
                    <Button
                        onClick={handleSaveAll}
                        isLoading={isSavingAll}
                        disabled={isSavingAll || isPublishing}
                        variant="primary"
                        size="md"
                    >
                        Submit All Ratings
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Tabs UI */}
                <div className="relative">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-2 border-b border-border relative z-10 bg-surface-1">
                        {['striker', 'midfielder', 'defender', 'goalkeeper', 'other'].map(pos => (
                            <button
                                key={pos}
                                onClick={() => {
                                    setActiveTab(pos)
                                    setHasSwitchedTabs(true)
                                }}
                                className={`px-4 py-2 rounded-t-lg text-sm font-semibold capitalize whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                    activeTab === pos
                                        ? 'bg-surface-2 text-accent border-t-2 border-accent shadow-sm'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-2/50 border-t-2 border-transparent'
                                }`}
                            >
                                {pos === 'other' ? 'Other' : `${pos}s`}
                            </button>
                        ))}
                    </div>

                    {/* Tutorial Tooltip overlay */}
                    {disclaimerClosed && !hasSwitchedTabs && (
                        <div className="absolute top-full left-4 sm:left-10 mt-3 z-20 animate-bounce">
                            <div className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xl shadow-accent/20 relative flex items-center gap-3">
                                <div className="absolute -top-[6px] left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-accent" />
                                <span>👋 Don't forget to switch tabs to rate all players!</span>
                                <button
                                    onClick={() => setHasSwitchedTabs(true)}
                                    className="p-1 -mx-1 hover:bg-black/20 rounded-full transition-colors focus:outline-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subheadings */}
                <div className="px-1 -mt-2">
                    {activeTab === 'striker' && <p className="text-sm text-text-muted">Compare against other Strikers. <strong className="text-text-primary">Who is the most lethal forward?</strong></p>}
                    {activeTab === 'midfielder' && <p className="text-sm text-text-muted">Compare against other Midfielders. <strong className="text-text-primary">Who controls the game best?</strong></p>}
                    {activeTab === 'defender' && <p className="text-sm text-text-muted">Compare against other Defenders. <strong className="text-text-primary">Who is the most solid at the back?</strong></p>}
                    {activeTab === 'goalkeeper' && <p className="text-sm text-text-muted">Compare against other Goalkeepers. <strong className="text-text-primary">Who is the most reliable stopper?</strong></p>}
                    {activeTab === 'other' && <p className="text-sm text-text-muted">Players without a specific assigned position.</p>}
                </div>

                {(() => {
                    const groupPlayers = players.filter(p => {
                        const pos = p.player_position?.toLowerCase() || ''
                        if (activeTab === 'striker') return pos.includes('striker') || pos.includes('forward')
                        if (activeTab === 'midfielder') return pos.includes('midfield')
                        if (activeTab === 'defender') return pos.includes('defend')
                        if (activeTab === 'goalkeeper') return pos.includes('goal') || pos.includes('gk')
                        return !pos.includes('striker') && !pos.includes('forward') && !pos.includes('midfield') && !pos.includes('defend') && !pos.includes('goal') && !pos.includes('gk')
                    })

                    if (groupPlayers.length === 0) {
                        return (
                            <Card className="py-12 mt-4 flex items-center justify-center border border-dashed border-border/50">
                                <p className="text-sm text-text-muted">No {activeTab === 'other' ? 'Other Players' : `${activeTab}s`} found to rate.</p>
                            </Card>
                        )
                    }

                    return (
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex flex-col gap-4">
                                {groupPlayers.map(player => {
                                    const currentRating = localRatings[player.id] ?? 30 // Default to 30 if not rated
                                    const hasExistingRating = myRatings.some(r => r.ratee_id === player.id)

                                    return (
                                        <Card key={player.id} className="flex flex-col md:flex-row md:items-center gap-4 !p-4">
                                            <div className="flex items-center gap-3 w-full md:w-64 shrink-0">
                                                <Avatar
                                                    firstName={player.first_name}
                                                    lastName={player.last_name}
                                                    avatarUrl={player.avatar_url}
                                                    size="md"
                                                />
                                                <div className="flex-1 flex items-center justify-between min-w-0">
                                                    <p className="font-semibold text-text-primary truncate mr-2">
                                                        {player.first_name} {player.last_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <p className="text-xs text-text-muted capitalize">
                                                            {player.player_position ?? 'Unknown Position'}
                                                        </p>
                                                        {hasExistingRating && (
                                                            <Badge variant="green" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
                                                                Rated
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-mono text-text-muted font-medium w-6 text-right">30</span>

                                                    <div className="relative flex-1 flex items-center h-4">
                                                        {/* Horizontal connecting line (background) */}
                                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-border rounded-full" />

                                                        {/* Active filled line */}
                                                        <div
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-accent rounded-full transition-all duration-150"
                                                            style={{ width: `${((currentRating - 30) / 70) * 100}%` }}
                                                        />

                                                        {/* Actual slider */}
                                                        <input
                                                            type="range"
                                                            min="30"
                                                            max="100"
                                                            step="1"
                                                            value={currentRating}
                                                            onChange={(e) => handleSliderChange(player.id, Number(e.target.value))}
                                                            className="relative w-full h-1 bg-transparent appearance-none cursor-pointer accent-accent transition-all z-10 touch-none"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col border-l border-border/50 pl-3 min-w-[70px] shrink-0 pointer-events-none">
                                                        <span className="text-[9px] uppercase font-bold text-text-muted leading-tight">Top {activeTab === 'other' ? 'Player' : activeTab}</span>
                                                        <span className="text-[10px] text-text-muted font-mono leading-tight">Max 100</span>
                                                    </div>

                                                    <span className="text-xl font-mono font-bold text-accent w-10 text-right shrink-0 ml-auto">
                                                        {currentRating}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {/* Sticky mobile submit button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-1 border-t border-border md:hidden z-20">
                <Button
                    onClick={handleSaveAll}
                    isLoading={isSavingAll}
                    disabled={isSavingAll}
                    variant="primary"
                    className="w-full"
                    size="lg"
                >
                    Submit All Ratings
                </Button>
            </div>

            {/* Unsaved Changes Modal */}
            {showUnsavedPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm !p-6 flex flex-col gap-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">Unsaved Ratings</h3>
                            <p className="mt-2 text-sm text-text-muted leading-relaxed">
                                You have unsaved ratings. Do you want to submit them before leaving?
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="primary"
                                onClick={handleSaveAll}
                                isLoading={isSavingAll}
                            >
                                Submit the ratings
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleDiscardAndNavigate}
                                disabled={isSavingAll}
                            >
                                Submit later
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowUnsavedPrompt(false)
                                    sessionStorage.removeItem('pendingRatingsNav')
                                }}
                                disabled={isSavingAll}
                                className="mt-2 text-text-muted hover:text-text-primary"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
