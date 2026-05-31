import React from 'react'
import { RefreshCw, Server, Play, Trash2 } from 'lucide-react'

interface Props {
    forceOverwrite: boolean
    onToggleForce: (next: boolean) => void
    onRefresh: () => void
    onSyncRedux: () => void
    onMigrateAll: () => void
    onClearAll: () => void
    busy?: boolean
}

export default function GlobalActionBar({
    forceOverwrite,
    onToggleForce,
    onRefresh,
    onSyncRedux,
    onMigrateAll,
    onClearAll,
    busy = false,
}: Props) {
    return (
        <div className="flex items-center justify-between gap-4 p-3 bg-white border rounded">
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={forceOverwrite}
                        onChange={(e) => onToggleForce(e.target.checked)}
                        className="form-checkbox h-4 w-4"
                    />
                    <span>Force overwrite</span>
                </label>
                <span className="text-xs text-gray-500">When enabled, migrations overwrite existing KV/redux entries.</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onRefresh}
                    disabled={busy}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2"
                >
                    <RefreshCw size={14} /> Refresh
                </button>

                {/* Sync Redux removed — app does not use Redux */}

                <button
                    onClick={onMigrateAll}
                    disabled={busy}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2"
                >
                    <Play size={14} /> Migrate All
                </button>

                <button
                    onClick={onClearAll}
                    disabled={busy}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
                >
                    <Trash2 size={14} /> Clear All
                </button>
            </div>
        </div>
    )
}
