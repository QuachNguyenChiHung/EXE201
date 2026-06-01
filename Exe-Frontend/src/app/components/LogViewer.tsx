import React, { forwardRef } from 'react'
import { Database } from 'lucide-react'
import type { LogEntry, LogLevel } from '../../types'

type Props = {
    logs: LogEntry[]
    onClear: () => void
    logColors: Record<LogLevel, string>
    height?: number
}

const LogViewer = forwardRef<HTMLDivElement, Props>(({ logs, onClear, logColors, height = 200 }, ref) => {
    return (
        <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <Database style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
                    Activity Log
                </div>
                <button
                    onClick={onClear}
                    style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Xóa log
                </button>
            </div>
            <div
                ref={ref}
                style={{ height, overflowY: 'auto', padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}
            >
                {logs.length === 0
                    ? <span style={{ color: 'var(--color-text-muted)' }}>Chưa có hoạt động nào. Nhấn Migrate để bắt đầu.</span>
                    : logs.map((l, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 10 }}>{l.timestamp}</span>
                            <span style={{ color: logColors[l.level] }}>{l.message}</span>
                        </div>
                    ))}
            </div>
        </div>
    )
})

LogViewer.displayName = 'LogViewer'

export default LogViewer
