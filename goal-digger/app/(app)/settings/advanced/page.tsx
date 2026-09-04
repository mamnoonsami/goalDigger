'use client'

import { useState, useEffect } from 'react'
import { Card } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { Button } from '../../../../components/ui/Button'
import { useToast } from '../../../../components/providers/ToastProvider'
import { 
    getTenant, 
    getTenantEtransferEmails, 
    updateTenantEtransferEmail, 
    addTenantEtransferEmail 
} from '../../../actions/tenant'

interface EmailOption {
    id?: string
    email: string
    name?: string
    isCustom: boolean
}

export default function AdvancedSettingsPage() {
    const toast = useToast()
    const [tenant, setTenant] = useState<{ id: string; name: string; etransferEmail: string; isAdmin: boolean } | null>(null)
    const [emailOptions, setEmailOptions] = useState<EmailOption[]>([])
    const [selectedEmail, setSelectedEmail] = useState('')
    const [customInputEmail, setCustomInputEmail] = useState('')
    
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [addingEmail, setAddingEmail] = useState(false)
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newEmail, setNewEmail] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const [tData, emails] = await Promise.all([
                getTenant(),
                getTenantEtransferEmails()
            ])
            setTenant(tData)
            setEmailOptions(emails)
            setSelectedEmail(tData.etransferEmail)
        } catch (err: any) {
            console.error('Failed to load advanced settings:', err)
            toast.error(err.message || 'Failed to load settings.')
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveActiveEmail(e: React.FormEvent) {
        e.preventDefault()
        if (!tenant?.isAdmin) return
        
        const targetEmail = selectedEmail === 'custom' ? customInputEmail.trim() : selectedEmail
        if (!targetEmail || !targetEmail.includes('@')) {
            toast.error('Please enter a valid email address.')
            return
        }

        setSaving(true)
        try {
            if (selectedEmail === 'custom' && !emailOptions.some(e => e.email === targetEmail)) {
                await addTenantEtransferEmail(targetEmail)
            }
            
            await updateTenantEtransferEmail(targetEmail)
            setTenant(prev => prev ? { ...prev, etransferEmail: targetEmail } : null)
            toast.success('Active e-Transfer email updated successfully!')
            await loadData()
        } catch (err: any) {
            toast.error(err.message || 'Failed to update e-transfer email.')
        } finally {
            setSaving(false)
        }
    }

    async function handleAddNewEmail(e: React.FormEvent) {
        e.preventDefault()
        const clean = newEmail.trim().toLowerCase()
        if (!clean || !clean.includes('@')) {
            toast.error('Please enter a valid email address.')
            return
        }

        setAddingEmail(true)
        try {
            await addTenantEtransferEmail(clean)
            toast.success('New e-Transfer email added!')
            setNewEmail('')
            setIsAddModalOpen(false)
            await loadData()
            setSelectedEmail(clean)
        } catch (err: any) {
            toast.error(err.message || 'Failed to add email.')
        } finally {
            setAddingEmail(false)
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
                    Failed to load group information. Please refresh the page.
                </p>
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl min-w-0">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Advanced Settings</h1>
                <p className="mt-1 text-sm text-text-muted">
                    Configure payment settings and e-Transfer recipient details for your squad.
                </p>
            </div>

            {/* Active E-Transfer Email Card */}
            <Card className="min-w-0 overflow-visible relative">
                {/* Header with Title and Add New Email button */}
                <div className="mb-6 border-b border-border/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-text-primary text-base sm:text-lg truncate">Active E-Transfer Recipient</h2>
                            <p className="text-xs text-text-muted mt-0.5">
                                Recipient for player match cost e-Transfers.
                            </p>
                        </div>
                    </div>

                    {tenant.isAdmin && (
                        <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => setIsAddModalOpen(true)}
                            className="shrink-0 text-xs sm:text-sm self-start sm:self-auto"
                        >
                            + Add New Email
                        </Button>
                    )}
                </div>

                <form onSubmit={handleSaveActiveEmail} className="flex flex-col gap-5 min-w-0">
                    {/* Custom Dropdown Field & Tray - Exactly 100% width matching field on mobile & desktop */}
                    <div className="relative min-w-0 w-full">
                        <label className="text-xs sm:text-sm font-semibold text-text-primary mb-2 block">
                            Select E-Transfer Email
                        </label>
                        
                        {/* Dropdown Field Trigger */}
                        <button
                            type="button"
                            disabled={!tenant.isAdmin || saving}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-full min-w-0 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs sm:text-sm text-text-primary font-mono flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 transition-colors"
                        >
                            <span className="truncate min-w-0 flex-1">
                                {selectedEmail === 'custom' ? (
                                    '+ Enter a custom email address...'
                                ) : (
                                    (() => {
                                        const opt = emailOptions.find(o => o.email === selectedEmail)
                                        if (!opt) return selectedEmail || 'Select an email...'
                                        return `${opt.email}${opt.name ? ` (${opt.name})` : ''}${opt.email === tenant.etransferEmail ? ' ✓ Active' : ''}`
                                    })()
                                )}
                            </span>
                            <svg
                                className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Tray Menu - Aligned to exact width of field and overflowing card */}
                        {dropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-30" 
                                    onClick={() => setDropdownOpen(false)} 
                                />

                                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 w-full min-w-0 bg-surface-2 border border-border rounded-xl shadow-2xl max-h-72 overflow-y-auto p-1.5 pb-2 text-xs sm:text-sm font-mono flex flex-col gap-1">
                                    {emailOptions.map((opt) => {
                                        const isSelected = opt.email === selectedEmail
                                        const isActive = opt.email === tenant.etransferEmail
                                        return (
                                            <button
                                                key={opt.email}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEmail(opt.email)
                                                    setDropdownOpen(false)
                                                }}
                                                className={`w-full shrink-0 min-h-[38px] text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 min-w-0 ${
                                                    isSelected 
                                                        ? 'bg-accent/15 text-accent font-semibold' 
                                                        : 'text-text-primary hover:bg-surface-3'
                                                }`}
                                            >
                                                <span className="truncate min-w-0 flex-1">
                                                    {opt.email} {opt.name ? `(${opt.name})` : ''}
                                                </span>
                                                {isActive && (
                                                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full shrink-0 font-bold">
                                                        Active
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}

                                    <div className="pt-1 border-t border-border/50 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedEmail('custom')
                                                setDropdownOpen(false)
                                            }}
                                            className={`w-full shrink-0 min-h-[38px] text-left px-3 py-2.5 rounded-lg transition-colors text-accent hover:bg-accent/10 font-semibold flex items-center gap-2 ${
                                                selectedEmail === 'custom' ? 'bg-accent/15' : ''
                                            }`}
                                        >
                                            <span className="truncate min-w-0">+ Enter a custom email address...</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {selectedEmail === 'custom' && (
                        <Input
                            label="Custom Email Address"
                            type="email"
                            placeholder="e.g. payments@squad.com"
                            value={customInputEmail}
                            onChange={(e) => setCustomInputEmail(e.target.value)}
                            required
                            disabled={!tenant.isAdmin || saving}
                        />
                    )}

                    <div className="bg-surface-3 border border-border/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-xs text-text-muted uppercase font-bold tracking-wider">Current Recipient</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-accent break-all select-all mt-0.5">
                                {tenant.etransferEmail}
                            </span>
                        </div>
                        <span className="text-[11px] bg-accent/15 text-accent px-2.5 py-1 rounded-full font-semibold self-start sm:self-auto shrink-0">
                            Active for Match Costs
                        </span>
                    </div>

                    {tenant.isAdmin && (
                        <div className="flex justify-start mt-1">
                            <Button type="submit" isLoading={saving} className="w-full sm:w-auto">
                                Save Active Email
                            </Button>
                        </div>
                    )}
                </form>
            </Card>

            {/* Add New Email Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-md border border-border p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base sm:text-lg font-bold text-text-primary">Add New E-Transfer Email</h3>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-text-muted hover:text-text-primary transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-text-muted">
                            This email address will be saved for your group and can be selected as your active match payment recipient.
                        </p>

                        <form onSubmit={handleAddNewEmail} className="flex flex-col gap-4">
                            <Input
                                label="E-Transfer Email Address"
                                type="email"
                                placeholder="e.g. treasurer@squad.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                autoFocus
                            />

                            <div className="flex justify-end gap-2.5 mt-2">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={addingEmail}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={addingEmail}>
                                    Add Email
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
