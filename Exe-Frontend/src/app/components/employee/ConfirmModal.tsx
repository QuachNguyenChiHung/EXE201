import React from 'react'
import Modal from '../../components/Modal'

export default function ConfirmModal({
    title,
    message,
    confirmLabel,
    confirmColor,
    onConfirm,
    onCancel,
}: {
    title: string
    message: string
    confirmLabel: string
    confirmColor: string
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <Modal title={title} onClose={onCancel} className="max-w-sm" footer={(
            <div className="px-0 pb-0 flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 py-2 text-sm border border-[var(--color-border)]"
                    style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
                <button onClick={onConfirm}
                    className="flex-1 py-2 text-sm text-white"
                    style={{ background: confirmColor }}>{confirmLabel}</button>
            </div>
        )}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
        </Modal>
    )
}
