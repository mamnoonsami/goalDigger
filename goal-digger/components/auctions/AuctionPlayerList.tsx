import { useEffect, useRef, useState } from 'react'
import { markPlayerSold, markPlayerUnsold } from '../../app/actions/auctions'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Avatar } from '../ui/Avatar'

interface AuctionPlayer {
    id: string
    player_id: string
    base_price: number
    sold_to: string | null
    sold_price: number | null
    status: string
    display_order: number | null
    profiles: {
        first_name: string
        last_name: string
        player_position: string | null
        base_score: number
        avatar_url?: string | null
    } | {
        first_name: string
        last_name: string
        player_position: string | null
        base_score: number
        avatar_url?: string | null
    }[]
}

// Helper to reliably get the profile object whether Supabase returns an array or object
function getProfile(player: AuctionPlayer) {
    return Array.isArray(player.profiles) ? player.profiles[0] : player.profiles
}

interface AuctionPlayerListProps {
    auctionId: string
    isAdmin: boolean
    players: AuctionPlayer[]
    managers?: { id: string; first_name: string; last_name: string; avatar_url: string | null }[]
    selectedPlayerId?: string | null
}

export function AuctionPlayerList({ auctionId, isAdmin, players, managers = [], selectedPlayerId }: AuctionPlayerListProps) {
    const selectedRef = useRef<HTMLDivElement>(null)

    const [sellingPlayerId, setSellingPlayerId] = useState<string | null>(null)
    const [soldPrice, setSoldPrice] = useState('')
    const [selectedManagerId, setSelectedManagerId] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        if (selectedPlayerId && selectedRef.current) {
            // Add a tiny delay to ensure render is complete, then scroll
            setTimeout(() => {
                selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
        }
    }, [selectedPlayerId])

    const handleUnsold = async (playerId: string) => {
        setIsProcessing(true)
        try {
            await markPlayerUnsold(auctionId, playerId)
        } catch (error) {
            console.error(error)
            alert('Failed to mark player as unsold.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSoldConfirm = async (playerId: string) => {
        const price = parseInt(soldPrice)
        if (isNaN(price) || price < 0) {
            alert('Please enter a valid price.')
            return
        }
        if (!selectedManagerId) {
            alert('Please select a manager.')
            return
        }

        setIsProcessing(true)
        try {
            await markPlayerSold(auctionId, playerId, price, selectedManagerId)
            setSellingPlayerId(null)
            setSoldPrice('')
            setSelectedManagerId('')
        } catch (error) {
            console.error(error)
            alert('Failed to mark player as sold.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="rounded-lg border border-border divide-y divide-border overflow-y-auto bg-surface-1 max-h-[400px]">
                {players.length === 0 ? (
                    <p className="py-6 text-center text-sm text-text-muted">No players added to this auction.</p>
                ) : (
                    players.map(player => {
                        const profile = getProfile(player)
                        const isSelected = selectedPlayerId === player.player_id
                        const isSelling = sellingPlayerId === player.player_id
                        const isSold = player.status === 'sold'
                        const isUnsold = player.status === 'unsold'
                        const isPending = player.status === 'pending'

                        return (
                            <div
                                key={player.id}
                                ref={isSelected ? selectedRef : null}
                                className={`flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2 transition-colors ${isSelected && !isSold
                                    ? 'bg-accent/20 border-l-4 border-l-accent'
                                    : isSold
                                        ? 'bg-surface-0/50 opacity-60 grayscale hover:grayscale-0 transition-all cursor-default'
                                        : isPending
                                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                            : 'bg-surface-1'
                                    }`}
                            >
                                <div className={`flex-shrink-0 rounded-full ${isSold ? 'opacity-60 grayscale' :
                                    isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface-1' : ''
                                    }`}>
                                    <Avatar
                                        firstName={profile.first_name}
                                        lastName={profile.last_name}
                                        avatarUrl={profile.avatar_url}
                                        size="sm"
                                        className={!isSold && !isSelected ? 'border-amber-500/30' : ''}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                    <div className="flex items-center min-w-0 flex-1">
                                        <span className={`text-sm font-medium truncate ${isSelected && !isSold ? 'text-accent font-bold' : 'text-text-primary'}`}>
                                            {profile.first_name} {profile.last_name}
                                        </span>
                                        <span className="ml-2 text-xs text-text-muted capitalize hidden sm:inline-block">
                                            {profile.player_position ?? 'N/A'}
                                        </span>
                                        {isSelected && !isAdmin && !isSold && (
                                            <span className="ml-2 text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 whitespace-nowrap animate-pulse">
                                                Up Next!
                                            </span>
                                        )}
                                        {isUnsold && !isSold && (
                                            <span className="ml-2 text-[10px] uppercase font-bold text-red-500 px-2 py-0.5 rounded-full bg-red-500/10 whitespace-nowrap">
                                                Unsold
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0 flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                                        {isAdmin && isSelected && !isSelling && !isSold && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSellingPlayerId(player.player_id)
                                                        setSoldPrice(player.base_price.toString())
                                                    }}
                                                    disabled={isProcessing}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 py-1 h-7 text-xs px-3"
                                                >
                                                    Sold
                                                </Button>
                                                {!isUnsold && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleUnsold(player.player_id)}
                                                        disabled={isProcessing}
                                                        className="py-1 h-7 text-xs px-3"
                                                    >
                                                        Unsold
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {isAdmin && isSelected && isSelling && !isSold && (
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                                                    <select
                                                        value={selectedManagerId}
                                                        onChange={(e) => setSelectedManagerId(e.target.value)}
                                                        className="h-7 text-xs rounded-lg border border-border bg-surface-2 px-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40 w-full sm:w-32"
                                                    >
                                                        <option value="" disabled>Select Manager</option>
                                                        {managers.map(m => (
                                                            <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                                        ))}
                                                    </select>

                                                    <div className="relative flex-1 sm:w-20">
                                                        <Input
                                                            type="number"
                                                            value={soldPrice}
                                                            onChange={(e) => setSoldPrice(e.target.value)}
                                                            placeholder="Price"
                                                            min={0}
                                                            step={10}
                                                            autoFocus
                                                            className="pl-6 h-7 text-xs w-full"
                                                        />
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-medium">
                                                            $
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 justify-end w-full sm:w-auto">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleSoldConfirm(player.player_id)}
                                                        disabled={isProcessing || !soldPrice || !selectedManagerId}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 p-1 h-7 w-7 flex items-center justify-center flex-shrink-0"
                                                        title="Confirm"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSellingPlayerId(null)
                                                            setSoldPrice('')
                                                            setSelectedManagerId('')
                                                        }}
                                                        disabled={isProcessing}
                                                        className="p-1 h-7 w-7 flex items-center justify-center flex-shrink-0 text-text-muted hover:text-text-primary"
                                                        title="Cancel"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {!isSold && (!isSelected || (isSelected && !isAdmin) || (isSelected && isAdmin && !isSelling)) && (
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-text-primary leading-none">{player.base_price}</div>
                                                <div className="text-[10px] text-text-muted leading-none mt-1">base</div>
                                            </div>
                                        )}

                                        {isSold && (
                                            <div className="text-right flex items-center justify-end gap-3 min-w-[100px]">
                                                {player.sold_to && (
                                                    <div className="hidden sm:flex items-center gap-1.5 mr-2">
                                                        <div className="text-[10px] text-text-muted">Bought by:</div>
                                                        <div className="text-[11px] font-semibold text-text-primary px-2 py-0.5 rounded bg-surface-2 border border-border">
                                                            {managers?.find(m => m.id === player.sold_to)?.first_name || 'Manager'}
                                                        </div>
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Sold</span>
                                                <div>
                                                    <div className="text-sm font-semibold text-emerald-400 leading-none">{player.sold_price}</div>
                                                    <div className="text-[10px] text-text-muted leading-none mt-1">price</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
