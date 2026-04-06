'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { updateProfile } from '../../app/actions/profile'
import { createClient } from '../../lib/supabase/client'
import imageCompression from 'browser-image-compression'

interface ProfileFormProps {
    profile: {
        first_name: string
        last_name: string
        player_position: string | null
        avatar_url: string | null
    }
    goals: number
}

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'striker']

/* ── Predefined avatar options using DiceBear API ── */
/* Each is a tiny URL string (~80 chars), stored in the `avatar_url` text column. */
const AVATAR_STYLES = [
    { style: 'avataaars-neutral', label: 'Avatars' },
    { style: 'bottts', label: 'Bots' },
    { style: 'micah', label: 'Micah' },
    { style: 'open-peeps', label: 'Open Peeps' },
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
    const firstName = profile.first_name
    const lastName = profile.last_name
    const [position, setPosition] = useState(profile.player_position ?? '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [showPicker, setShowPicker] = useState(false)
    const [activeStyle, setActiveStyle] = useState(AVATAR_STYLES[0].style)

    async function handleSave() {
        setSaving(true)
        setError(null)
        setSuccess(false)
        try {
            await updateProfile({
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

    async function handleUploadPicture(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) {
            return
        }
        
        const file = e.target.files[0]
        setUploading(true)
        setError(null)
        setSuccess(false)
        
        try {
            // Compress the image
            const options = {
                maxSizeMB: 0.09, // ~90KB max size
                maxWidthOrHeight: 400, // Reasonable avatar size
                useWebWorker: true,
            }
            
            const compressedFile = await imageCompression(file, options)
            
            // Get current user id
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                throw new Error('Not authenticated')
            }
            
            // Upload to Supabase
            const filePath = `${user.id}/avatar.jpeg`
            const { error: uploadError } = await supabase.storage
                .from('GoalDiggerProfilePictures')
                .upload(filePath, compressedFile, {
                    upsert: true,
                    contentType: 'image/jpeg',
                })
                
            if (uploadError) {
                throw uploadError
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('GoalDiggerProfilePictures')
                .getPublicUrl(filePath)
                
            // Append a timestamp to the URL to bypass browser cache
            const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`
                
            // Update local state and DB
            setAvatarUrl(cacheBustedUrl)
            await updateProfile({
                player_position: position || null,
                avatar_url: cacheBustedUrl,
            })
            
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to upload picture')
        } finally {
            setUploading(false)
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
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto max-w-[200px] sm:max-w-none mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPicker(!showPicker)}
                        className="w-full sm:w-auto border border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 hover:border-green-400 transition-colors"
                    >
                        {showPicker ? '✕ Close' : '🎨 Choose Avatar'}
                    </Button>
                    
                    <label className={`cursor-pointer inline-flex w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 hover:border-green-400 h-8 px-3 py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? '⏳ Uploading...' : '📁 Upload Picture'}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadPicture}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Avatar Picker */}
            {showPicker && (
                <div className="rounded-xl border border-border bg-surface-1 p-4">
                    {/* Style tabs */}
                    <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-2 mb-4 pb-1">
                        {AVATAR_STYLES.map(({ style, label }) => (
                            <button
                                key={style}
                                onClick={() => setActiveStyle(style)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${activeStyle === style
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-3 text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* DiceBear avatar grid */}
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
                        disabled
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-muted cursor-not-allowed opacity-70"
                    />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-muted">Last Name</span>
                    <input
                        type="text"
                        value={lastName}
                        disabled
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-muted cursor-not-allowed opacity-70"
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
