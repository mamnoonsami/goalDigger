'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { useToast } from '../providers/ToastProvider'
import { sendTeamRosterEmail, getEmailPreview } from '../../app/actions/matches'
import { formatDateTime12h } from '../../lib/utils'

interface Player {
    id: string
    name: string
    pos: string
}

interface SendRosterModalProps {
    matchId: string
    scheduledAt: string
    team1Ids: string[]
    team2Ids: string[]
    team1List: Player[]
    team2List: Player[]
    onClose: () => void
}

export function SendRosterModal({ matchId, scheduledAt, team1Ids, team2Ids, team1List, team2List, onClose }: SendRosterModalProps) {
    const toast = useToast()
    const [sending, setSending] = useState(false)
    const [loadingPreview, setLoadingPreview] = useState(true)
    const [previewData, setPreviewData] = useState<{subject: string, html: string, recipients: {id: string, name: string, email: string}[]} | null>(null)

    useEffect(() => {
        let mounted = true
        async function fetchPreview() {
            try {
                const localizedTime = formatDateTime12h(scheduledAt)
                const allIds = [...team1Ids, ...team2Ids]
                const data = await getEmailPreview('roster', matchId, allIds, localizedTime, undefined, team1List, team2List)
                if (mounted) {
                    setPreviewData(data)
                    setLoadingPreview(false)
                }
            } catch (err: any) {
                console.error('Preview error:', err)
                if (mounted) {
                    toast.error(err.message || 'Failed to generate preview')
                    onClose()
                }
            }
        }
        fetchPreview()
        return () => { mounted = false }
    }, [matchId, scheduledAt, team1Ids, team2Ids, team1List, team2List, toast, onClose])

    async function handleConfirmSend() {
        setSending(true)
        try {
            const localizedTime = formatDateTime12h(scheduledAt)
            const allIds = [...team1Ids, ...team2Ids]
            await sendTeamRosterEmail(matchId, allIds, team1List, team2List, localizedTime)
            toast.success(`Successfully broadcasted team roster to ${allIds.length} players!`)
            onClose()
        } catch (err: unknown) {
            console.error(`Error sending roster email:`, err)
            toast.error('Failed to send roster email.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-1 rounded-xl shadow-2xl w-full max-w-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-4 sm:px-6 sm:py-5 border-b border-border flex items-center justify-between bg-surface-2">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-text-primary">Broadcast Team Roster</h2>
                        <p className="text-xs sm:text-sm text-text-muted mt-1">Review the roster email before sending.</p>
                    </div>
                    <button onClick={onClose} disabled={sending} className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-full hover:bg-surface-3 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-surface-2 p-4 gap-4">
                    {loadingPreview ? (
                         <div className="flex flex-col items-center justify-center py-12">
                            <svg className="animate-spin h-8 w-8 text-accent opacity-50 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-text-muted">Loading preview...</span>
                        </div>
                    ) : previewData ? (
                        <>
                            <div className="bg-surface-1 border border-border rounded-lg shadow-sm p-3">
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recipients ({previewData.recipients.length})</h3>
                                <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                                    {previewData.recipients.map(r => (
                                        <div key={r.id} className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-text-primary truncate mr-2">{r.name}</span>
                                            <span className="text-text-muted truncate">{r.email}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1 border border-border rounded-lg overflow-hidden bg-white shadow-inner flex flex-col relative">
                                <div className="bg-surface-3 border-b border-border px-3 py-2 text-xs text-text-muted flex gap-2 font-mono">
                                    <span className="font-bold">Subject:</span> {previewData.subject}
                                </div>
                                <div 
                                    className="flex-1 overflow-y-auto p-4 [&_a]:pointer-events-none" 
                                    dangerouslySetInnerHTML={{ __html: previewData.html || '' }} 
                                />
                                {sending && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                                        <div className="relative flex items-center justify-center mb-4">
                                            <svg className="animate-spin h-10 w-10 text-accent opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            </svg>
                                            <svg className="animate-spin h-10 w-10 text-accent absolute left-0 top-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                        <div className="text-sm font-bold text-text-primary mb-2">
                                            Broadcasting Email...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-danger">Failed to load preview data.</div>
                    )}
                </div>
                
                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-1 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button" disabled={sending}>Cancel</Button>
                    <Button type="button" onClick={handleConfirmSend} disabled={sending || loadingPreview || !previewData} className="min-w-[150px]">
                        {sending ? 'Sending...' : 'Confirm & Send'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
