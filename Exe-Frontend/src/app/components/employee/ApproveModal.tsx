import React, { useState } from 'react'
import Modal from '../../components/Modal'
import { Loader2, AlertCircle, Shield } from 'lucide-react'
import type { CompositeWarehouse, CertificationSubmit, CertificationType } from '../../../types'

export default function ApproveModal({
    warehouse,
    certTypes,
    certTypesLoading,
    onConfirm,
    onCancel,
}: {
    warehouse: CompositeWarehouse
    certTypes: CertificationType[]
    certTypesLoading: boolean
    onConfirm: (selectedCerts: CertificationSubmit[]) => void
    onCancel: () => void
}) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
        const existing = new Set(warehouse.certifications.map(c => c.label))
        const ids = new Set<number>()
        certTypes.forEach(ct => { if (existing.has(ct.label)) ids.add(ct.id_certification) })
        return ids
    })

    const toggle = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const handleConfirm = () => {
        const certs: CertificationSubmit[] = certTypes
            .filter(ct => selectedIds.has(ct.id_certification))
            .map(ct => ({
                id_cerfSubmit: Date.now() + Math.floor(Math.random() * 1000),
                link: '#',
                isVerified: true,
                id_type: ct.id_certification,
            }))
        onConfirm(certs)
    }

    return (
        <Modal title={"Duyệt & Xác nhận chứng nhận"} onClose={onCancel} className="max-w-lg" footer={(
            <div className="px-0 pb-0 flex items-center justify-between gap-3">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selectedIds.size} chứng nhận được chọn</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-sm border border-[var(--color-border)]"
                        style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-4 py-2 text-sm text-white"
                        style={{ background: 'var(--color-success, #22c55e)' }}>
                        <CheckIcon /> Duyệt & Kích hoạt
                    </button>
                </div>
            </div>
        )}>
            <div className="px-0">
                <div className="px-5 py-3 border-b border-[var(--color-border)]" style={{ background: 'rgba(37,99,235,0.04)' }}>
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            Dựa trên tài liệu PDF mà chủ kho đã nộp, hãy chọn các chứng nhận đã được xác minh.
                            Kho sẽ được kích hoạt và hiển thị trên nền tảng với các chứng nhận đã chọn.
                        </p>
                    </div>
                </div>

                <div className="px-5 py-3">
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Kho: <strong>{warehouse.name}</strong></p>
                </div>

                <div className="px-5 py-3 max-h-[60vh] overflow-y-auto">
                    {certTypesLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                        </div>
                    ) : certTypes.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                Chưa có loại chứng nhận nào. Vui lòng thêm tại trang quản lý chứng nhận.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {certTypes.map(ct => {
                                const isSelected = selectedIds.has(ct.id_certification)
                                return (
                                    <label key={ct.id_certification}
                                        className="flex items-start gap-3 p-3 border cursor-pointer transition-colors select-none"
                                        style={{
                                            borderColor: isSelected ? 'var(--color-success, #22c55e)' : 'var(--color-border)',
                                            background: isSelected ? 'rgba(34,197,94,0.05)' : 'transparent',
                                        }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggle(ct.id_certification)}
                                            className="w-4 h-4 mt-0.5 accent-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 text-white text-[10px] px-1.5 py-0.5 font-semibold shrink-0"
                                                    style={{ background: isSelected ? 'var(--color-success, #22c55e)' : 'var(--color-text-muted)' }}>
                                                    <Shield className="h-2.5 w-2.5" /> {ct.label}
                                                </span>
                                                <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{ct.label}</span>
                                            </div>
                                            <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{ct.law_references}</p>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}

function CheckIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
