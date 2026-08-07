'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { createClient } from '../../lib/supabase/client'
import { updateProfile } from '../../app/actions/profile'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface ProfilePhotoManagerProps {
    firstName: string
    lastName: string
    initialAvatarUrl: string | null
}

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

export function ProfilePhotoManager({ firstName, lastName, initialAvatarUrl }: ProfilePhotoManagerProps) {
    const router = useRouter()
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')
    const [pendingAvatarUrl, setPendingAvatarUrl] = useState(initialAvatarUrl ?? '')
    const [menuOpen, setMenuOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [changeOpen, setChangeOpen] = useState(false)
    const [showAvatarLibrary, setShowAvatarLibrary] = useState(false)
    const [activeStyle, setActiveStyle] = useState(AVATAR_STYLES[0].style)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function openChangeDialog() {
        setMenuOpen(false)
        setPendingAvatarUrl(avatarUrl)
        setShowAvatarLibrary(false)
        setError(null)
        setChangeOpen(true)
    }

    async function saveAvatar() {
        setSaving(true)
        setError(null)
        try {
            await updateProfile({ avatar_url: pendingAvatarUrl || null })
            setAvatarUrl(pendingAvatarUrl)
            setChangeOpen(false)
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update profile picture')
        } finally {
            setSaving(false)
        }
    }

    async function handleUploadPicture(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0) return

        const file = event.target.files[0]
        setUploading(true)
        setError(null)

        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 0.09,
                maxWidthOrHeight: 400,
                useWebWorker: true,
            })

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const filePath = `${user.id}/avatar.jpeg`
            const { error: uploadError } = await supabase.storage
                .from('GoalDiggerProfilePictures')
                .upload(filePath, compressedFile, {
                    upsert: true,
                    contentType: 'image/jpeg',
                })
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('GoalDiggerProfilePictures')
                .getPublicUrl(filePath)
            const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`

            await updateProfile({ avatar_url: cacheBustedUrl })
            setAvatarUrl(cacheBustedUrl)
            setPendingAvatarUrl(cacheBustedUrl)
            setChangeOpen(false)
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to upload profile picture')
        } finally {
            setUploading(false)
            event.target.value = ''
        }
    }

    return (
        <>
            <div className="relative shrink-0">
                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Open profile picture options"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    className="group flex h-20 w-20 items-center justify-center rounded-full ring-4 ring-accent/10 transition-all hover:ring-accent/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40 sm:h-24 sm:w-24"
                >
                    <Avatar
                        firstName={firstName}
                        lastName={lastName}
                        avatarUrl={avatarUrl}
                        size="xl"
                        className="!h-20 !w-20 transition-opacity group-hover:opacity-90 sm:!h-24 sm:!w-24"
                    />
                </button>

                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div role="menu" className="absolute left-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-border bg-surface-2 p-1.5 shadow-xl shadow-black/15">
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => { setMenuOpen(false); setViewOpen(true) }}
                                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-surface-3"
                            >
                                View profile picture
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={openChangeDialog}
                                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                            >
                                Change profile picture
                            </button>
                        </div>
                    </>
                )}
            </div>

            {viewOpen && (
                <div role="dialog" aria-modal="true" aria-label="Profile picture" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewOpen(false)} />
                    <div className="relative flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <Avatar
                            firstName={firstName}
                            lastName={lastName}
                            avatarUrl={avatarUrl}
                            size="xl"
                            className="!h-64 !w-64 sm:!h-72 sm:!w-72"
                        />
                        <Button type="button" variant="secondary" className="mt-6" onClick={() => setViewOpen(false)}>Close</Button>
                    </div>
                </div>
            )}

            {changeOpen && (
                <div role="dialog" aria-modal="true" aria-labelledby="change-photo-heading" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && !uploading && setChangeOpen(false)} />
                    <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                            <div>
                                <h2 id="change-photo-heading" className="text-lg font-semibold text-text-primary">Change profile picture</h2>
                                <p className="mt-1 text-sm text-text-muted">Choose an avatar or select an image from your device.</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setChangeOpen(false)}
                                disabled={saving || uploading}
                                className="rounded-lg px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
                            {!showAvatarLibrary ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAvatarLibrary(true)}
                                        className="min-h-32 rounded-xl border border-border bg-surface-1/45 p-5 text-left transition-all hover:border-accent/40 hover:bg-accent/[0.05]"
                                    >
                                        <span className="block text-base font-semibold text-text-primary">Choose an avatar</span>
                                        <span className="mt-2 block text-sm leading-6 text-text-muted">Browse illustrated profile pictures and select a style.</span>
                                        <span className="mt-4 block text-xs font-semibold text-accent">Open avatar library</span>
                                    </button>

                                    <label className={`min-h-32 cursor-pointer rounded-xl border border-border bg-surface-1/45 p-5 text-left transition-all hover:border-accent/40 hover:bg-accent/[0.05] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                                        <span className="block text-base font-semibold text-text-primary">Choose from gallery</span>
                                        <span className="mt-2 block text-sm leading-6 text-text-muted">Select a photo stored on your phone, tablet, or computer.</span>
                                        <span className="mt-4 block text-xs font-semibold text-accent">{uploading ? 'Uploading…' : 'Select image'}</span>
                                        <input type="file" accept="image/*" className="sr-only" onChange={handleUploadPicture} disabled={uploading} />
                                    </label>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <button type="button" onClick={() => setShowAvatarLibrary(false)} className="text-sm font-medium text-text-muted transition-colors hover:text-text-primary">Back</button>
                                        <span className="text-xs text-text-muted">Select an avatar, then save</span>
                                    </div>

                                    <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
                                        {AVATAR_STYLES.map(({ style, label }) => (
                                            <button
                                                key={style}
                                                type="button"
                                                onClick={() => setActiveStyle(style)}
                                                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${activeStyle === style
                                                    ? 'border-accent bg-accent text-white'
                                                    : 'border-border bg-surface-1 text-text-muted hover:border-accent/30 hover:text-text-primary'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-10">
                                        {AVATAR_SEEDS.map((seed) => {
                                            const url = diceBearUrl(activeStyle, seed)
                                            const isSelected = pendingAvatarUrl === url
                                            return (
                                                <button
                                                    key={seed}
                                                    type="button"
                                                    onClick={() => setPendingAvatarUrl(url)}
                                                    className={`flex aspect-square items-center justify-center rounded-xl border-2 p-1 transition-all ${isSelected
                                                        ? 'border-accent bg-accent/10 ring-2 ring-accent/20'
                                                        : 'border-transparent bg-surface-1 hover:border-border'
                                                        }`}
                                                    aria-label={`Choose ${seed} avatar`}
                                                    title={seed}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={url} alt="" className="h-full w-full rounded-lg" loading="lazy" />
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button type="button" onClick={() => setPendingAvatarUrl('')} className="mt-4 text-xs font-medium text-text-muted transition-colors hover:text-danger">Use initials instead</button>
                                </div>
                            )}

                            {error && <p className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
                        </div>

                        {showAvatarLibrary && (
                            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4 sm:px-6">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setChangeOpen(false)} disabled={saving}>Cancel</Button>
                                <Button type="button" size="sm" onClick={saveAvatar} isLoading={saving}>Save picture</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
