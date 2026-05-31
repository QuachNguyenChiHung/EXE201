import React from 'react'
import { Play, Trash2, RefreshCw, FileText } from 'lucide-react'

type ResourceStatus = {
    state?: string
    progress?: number // 0-100
    lastUpdated?: string
    errors?: string[]
}

type Counts = { mock?: number; kv?: number }

export interface ResourceCardProps {
    resourceKey: string
    label: string
    counts?: Counts
    status?: ResourceStatus
    forceOverwrite?: boolean
    migrating?: boolean
    onMigrate?: (force?: boolean) => void
    onClear?: () => void
    onReload?: () => void
    onViewLogs?: () => void
}

export default function ResourceCard({
    resourceKey,
    label,
    counts = {},
    status,
    forceOverwrite = false,
    migrating = false,
    onMigrate,
    onClear,
    onReload,
    onViewLogs,
}: ResourceCardProps) {
    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-sm text-gray-500">{label}</div>
                    <div className="text-xs text-gray-400">{resourceKey}</div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
                        onClick={() => onMigrate && onMigrate(forceOverwrite)}
                        disabled={migrating}
                        title="Migrate"
                    >
                        <Play size={14} />
                    </button>

                    <button
                        className="px-3 py-1 rounded bg-amber-500 text-white text-sm disabled:opacity-60"
                        onClick={() => onReload && onReload()}
                        disabled={migrating}
                        title="Reload"
                    >
                        <RefreshCw size={14} />
                    </button>

                    <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-sm disabled:opacity-60"
                        onClick={() => onClear && onClear()}
                        disabled={migrating}
                        title="Clear"
                    >
                        <Trash2 size={14} />
                    </button>

                    <button
                        className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
                        onClick={() => onViewLogs && onViewLogs()}
                        title="Logs"
                    >
                        <FileText size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="p-2 border rounded text-center">
                    <div className="text-xs text-gray-500">Nguồn (mock)</div>
                    <div className="text-lg font-medium">{counts.mock ?? 0}</div>
                </div>
                <div className="p-2 border rounded text-center">
                    <div className="text-xs text-gray-500">KV Store</div>
                    <div className="text-lg font-medium">{counts.kv ?? 0}</div>
                </div>
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>Status: {status?.state ?? 'idle'}</div>
                    <div>{status?.lastUpdated ?? ''}</div>
                </div>

                {typeof status?.progress === 'number' && (
                    <div className="w-full bg-gray-100 rounded h-2 mt-2">
                        <div
                            className="h-2 bg-blue-600 rounded"
                            style={{ width: `${Math.max(0, Math.min(100, status!.progress!))}%` }}
                        />
                    </div>
                )}
            </div>

            {status?.errors && status.errors.length > 0 && (
                <div className="text-xs text-red-600 mt-2">{status.errors.join('; ')}</div>
            )}
        </div>
    )
}
