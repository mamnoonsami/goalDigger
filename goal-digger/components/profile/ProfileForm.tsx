'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { updateProfile } from '../../app/actions/profile'

interface ProfileFormProps {
    profile: {
        first_name: string
        last_name: string
        player_position: string | null
        avatar_url: string | null
    }
    goals: number
}

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward']

/* ── Predefined avatar options using DiceBear API ── */
/* Each is a tiny URL string (~80 chars), stored in the `avatar_url` text column. */
const GOALS_TO_UNLOCK = 15

const AVATAR_STYLES = [
    { style: 'avataaars-neutral', label: 'Avatars' },
    { style: 'big-smile', label: 'Big Smile' },
    { style: 'bottts', label: 'Bots' },
    { style: 'fun-emoji', label: 'Fun Emoji' },
    { style: 'micah', label: 'Micah' },
    { style: 'open-peeps', label: 'Open Peeps' },
    { style: 'toon-head', label: 'Toon Head' },
    { style: 'croodles', label: 'Croodles' },
    { style: 'croodles-neutral', label: 'Croodles Neutral' },
    { style: 'notionists', label: 'Notionists' },
    { style: 'lorelei', label: 'Lorelei' },
    { style: 'pixel-art', label: 'Pixel Art' },
]

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Garfield', 'Leo', 'Jasper',
    'Luna', 'Milo', 'Daisy', 'Rocky', 'Bella',
    'Max', 'Charlie', 'Coco', 'Ruby', 'Bear',
    'Willow', 'Oscar', 'Pepper', 'Zeus', 'Nova',
]

function diceBearUrl(style: string, seed: string) {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&size=80`
}

export function ProfileForm({ profile, goals }: ProfileFormProps) {
    const [firstName, setFirstName] = useState(profile.first_name)
    const [lastName, setLastName] = useState(profile.last_name)
    const [position, setPosition] = useState(profile.player_position ?? '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Avatar picker state
    const [showPicker, setShowPicker] = useState(false)
    const [activeStyle, setActiveStyle] = useState(AVATAR_STYLES[0].style)
    const isProsTab = activeStyle === 'pros'
    const prosLocked = goals < GOALS_TO_UNLOCK

    // TheSportsDB "Pros" tab state
    const [proQuery, setProQuery] = useState('')
    const [proResults, setProResults] = useState<{ id: string; name: string; thumb: string }[]>([])
    const [proLoading, setProLoading] = useState(false)
    const [proSearched, setProSearched] = useState(false)

    async function handleProSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!proQuery.trim()) return
        setProLoading(true)
        setProSearched(true)
        try {
            const formatted = proQuery.trim().replace(/\s+/g, '_')
            const res = await fetch(
                `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${formatted}`
            )
            const data = await res.json()
            const players = (data.player || [])
                .filter((p: any) => p.strSport === 'Soccer' && (p.strCutout || p.strThumb))
                .map((p: any) => ({
                    id: p.idPlayer,
                    name: p.strPlayer,
                    thumb: p.strCutout || p.strThumb,
                }))
            setProResults(players)
        } catch {
            setProResults([])
        } finally {
            setProLoading(false)
        }
    }


    async function handleSave() {
        setSaving(true)
        setError(null)
        setSuccess(false)
        try {
            await updateProfile({
                first_name: firstName,
                last_name: lastName,
                player_position: position || null,
                avatar_url: avatarUrl || null,
            })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Avatar section */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-24 w-24 rounded-full border-4 border-accent/30 object-cover bg-surface-3"
                        />
                    ) : (
                        <div className="h-24 w-24 rounded-full border-4 border-accent/30 bg-accent/20 flex items-center justify-center text-3xl font-bold text-accent">
                            {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    {showPicker ? '✕ Close' : '🎨 Choose Avatar'}
                </Button>
            </div>

            {/* Avatar Picker */}
            {showPicker && (
                <div className="rounded-xl border border-border bg-surface-1 p-4">
                    {/* Style tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {AVATAR_STYLES.map(({ style, label }) => (
                            <button
                                key={style}
                                onClick={() => setActiveStyle(style)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeStyle === style
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-3 text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                        {/* Pros tab */}
                        <button
                            onClick={() => setActiveStyle('pros')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isProsTab
                                ? prosLocked ? 'bg-surface-3 text-text-muted ring-1 ring-border' : 'bg-accent text-white'
                                : 'bg-surface-3 text-text-muted hover:text-text-primary'
                                }`}
                        >
                            {prosLocked ? '🔒 ' : ''}⚽ Pros
                        </button>
                    </div>

                    {/* DiceBear avatar grid */}
                    {!isProsTab && (
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {AVATAR_SEEDS.map((seed) => {
                                const url = diceBearUrl(activeStyle, seed)
                                const isSelected = avatarUrl === url
                                return (
                                    <button
                                        key={seed}
                                        onClick={() => setAvatarUrl(url)}
                                        className={`p-1 rounded-xl border-2 transition-all duration-150 ${isSelected
                                            ? 'border-accent ring-2 ring-accent/30 bg-accent/10 hover:scale-105'
                                            : 'border-transparent hover:border-border hover:scale-105'
                                            }`}
                                        title={seed}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={url}
                                            alt={seed}
                                            className="h-12 w-12 rounded-lg"
                                            loading="lazy"
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Pros — TheSportsDB search + results */}
                    {isProsTab && (
                        <div>
                            {/* Lock banner */}
                            {prosLocked && (
                                <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
                                    🔒 Score <strong>{GOALS_TO_UNLOCK}+ goals</strong> to use a pro player avatar. You currently have <strong>{goals}</strong>.
                                </div>
                            )}

                            <form onSubmit={handleProSearch} className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={proQuery}
                                    onChange={(e) => setProQuery(e.target.value)}
                                    placeholder="Search a pro player (e.g. Messi)"
                                    className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                                />
                                <button
                                    type="submit"
                                    disabled={proLoading || !proQuery.trim()}
                                    className="rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {proLoading ? '...' : 'Search'}
                                </button>
                            </form>

                            {proLoading && (
                                <p className="text-center text-xs text-text-muted py-4">Searching TheSportsDB...</p>
                            )}

                            {!proLoading && proSearched && proResults.length === 0 && (
                                <p className="text-center text-xs text-text-muted py-4">No soccer players found. Try a different name.</p>
                            )}

                            {!proLoading && proResults.length > 0 && (
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                    {proResults.slice(0, 20).map((player) => {
                                        const photoUrl = player.thumb + '/small'
                                        const isSelected = avatarUrl === photoUrl
                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => {
                                                    if (!prosLocked) setAvatarUrl(photoUrl)
                                                }}
                                                disabled={prosLocked}
                                                className={`p-1 rounded-xl border-2 transition-all duration-150 flex flex-col items-center gap-1 ${prosLocked
                                                    ? 'opacity-50 grayscale cursor-not-allowed border-transparent'
                                                    : isSelected
                                                        ? 'border-accent ring-2 ring-accent/30 bg-accent/10 hover:scale-105'
                                                        : 'border-transparent hover:border-border hover:scale-105'
                                                    }`}
                                                title={prosLocked ? `Score ${GOALS_TO_UNLOCK}+ goals to unlock` : player.name}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={photoUrl}
                                                    alt={player.name}
                                                    className="h-12 w-12 rounded-lg object-cover bg-surface-3"
                                                    loading="lazy"
                                                />
                                                <span className="text-[9px] text-text-muted truncate w-full text-center leading-tight">
                                                    {player.name.split(' ').pop()}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Remove avatar option */}
                    <button
                        onClick={() => setAvatarUrl('')}
                        className="mt-3 text-xs text-text-muted hover:text-danger transition-colors"
                    >
                        Remove avatar (use initials)
                    </button>
                </div>
            )}


            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-muted">First Name</span>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="rounded-lg border border-border bg-surface-1 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-muted">Last Name</span>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="rounded-lg border border-border bg-surface-1 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-muted">Position</span>
                <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="rounded-lg border border-border bg-surface-1 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 max-w-xs"
                >
                    <option value="">Not set</option>
                    {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>{pos.charAt(0).toUpperCase() + pos.slice(1)}</option>
                    ))}
                </select>
            </label>

            {/* Save */}
            <div className="flex items-center gap-3">
                <Button onClick={handleSave} isLoading={saving}>
                    Save Changes
                </Button>
                {success && <span className="text-sm text-success">✓ Saved</span>}
                {error && <span className="text-sm text-danger">{error}</span>}
            </div>
        </div>
    )
}
