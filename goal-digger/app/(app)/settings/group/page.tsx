'use client'

import { useState, useEffect } from 'react'
import { Card } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { Button } from '../../../../components/ui/Button'
import { getTenant, updateTenantName } from '../../../actions/tenant'

export default function GroupSettingsPage() {
    const [tenant, setTenant] = useState<{ id: string; name: string; isAdmin: boolean } | null>(null)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [copiedId, setCopiedId] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)

    useEffect(() => {
        loadTenant()
    }, [])

    async function loadTenant() {
        try {
            const data = await getTenant()
            setTenant(data)
            setName(data.name)
        } catch (err) {
            console.error('Failed to load group settings:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!tenant?.isAdmin) return

        setSaving(true)
        setMessage('')

        try {
            await updateTenantName(name)
            setTenant(prev => prev ? { ...prev, name } : null)
            setMessage('Group name updated successfully.')
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Failed to update group name.')
        } finally {
            setSaving(false)
        }
    }

    function copyToClipboard(text: string, type: 'id' | 'link') {
        navigator.clipboard.writeText(text)
        if (type === 'id') {
            setCopiedId(true)
            setTimeout(() => setCopiedId(false), 2000)
        } else {
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-8 w-48 bg-surface-3 rounded"></div>
                <Card className="h-64">
                    <div className="h-full w-full" />
                </Card>
            </div>
        )
    }

    if (!tenant) {
        return (
            <Card>
                <p className="text-center text-sm text-text-muted py-10">
                    Failed to load group information. Please try again.
                </p>
            </Card>
        )
    }

    const inviteLink = `${window.location.origin}/signup?invite=${tenant.id}`

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Group Settings</h1>
                <p className="mt-1 text-sm text-text-muted">Manage your squad settings and player invitations.</p>
            </div>

            {/* Main settings form */}
            <Card>
                <div className="mb-6 border-b border-border/50 pb-5">
                    <h2 className="font-semibold text-text-primary text-lg">Group Information</h2>
                    <p className="text-sm text-text-muted mt-1">Configure your group&apos;s display details.</p>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-xl">
                    <Input
                        label="Group Name"
                        type="text"
                        placeholder="Saturday Squad"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={!tenant.isAdmin || saving}
                    />

                    {message && (
                        <p className={`text-sm font-medium ${message.includes('successfully') ? 'text-accent' : 'text-danger'}`}>
                            {message}
                        </p>
                    )}

                    {tenant.isAdmin && (
                        <div className="flex justify-start mt-2">
                            <Button type="submit" isLoading={saving}>
                                Save Changes
                            </Button>
                        </div>
                    )}
                </form>
            </Card>

            {/* Invite and Group ID Card */}
            <Card>
                <div className="mb-6 border-b border-border/50 pb-5">
                    <h2 className="font-semibold text-text-primary text-lg">Player Onboarding</h2>
                    <p className="text-sm text-text-muted mt-1">Invite other players to join your group.</p>
                </div>

                <div className="flex flex-col gap-6 max-w-2xl">
                    {/* Group ID */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-text-primary">Group ID (Tenant ID)</span>
                        <p className="text-xs text-text-muted">
                            New users must input this ID on the signup page to join your group.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-surface-3 border border-border px-3 py-2.5 rounded-lg text-sm text-text-primary font-mono select-all overflow-x-auto truncate whitespace-nowrap">
                                {tenant.id}
                            </div>
                            <Button 
                                variant={copiedId ? "secondary" : "primary"}
                                onClick={() => copyToClipboard(tenant.id, 'id')}
                                className="whitespace-nowrap shrink-0"
                            >
                                {copiedId ? "Copied! ✓" : "Copy ID"}
                            </Button>
                        </div>
                    </div>

                    {/* Invite Link */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-text-primary">Invite Link</span>
                        <p className="text-xs text-text-muted">
                            Share this URL with players. The Group ID will be pre-filled automatically on the signup form.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-surface-3 border border-border px-3 py-2.5 rounded-lg text-sm text-text-primary font-mono select-all overflow-x-auto truncate whitespace-nowrap">
                                {inviteLink}
                            </div>
                            <Button 
                                variant={copiedLink ? "secondary" : "primary"}
                                onClick={() => copyToClipboard(inviteLink, 'link')}
                                className="whitespace-nowrap shrink-0"
                            >
                                {copiedLink ? "Copied! ✓" : "Copy Link"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
