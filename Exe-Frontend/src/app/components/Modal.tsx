import React from 'react';

type ModalProps = {
    title?: string;
    onClose?: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
};

export default function Modal({ title, onClose, children, footer, className }: ModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div className={`w-full max-w-lg border border-[var(--color-border)] bg-[var(--color-surface)] ${className ?? ''}`}>
                {title && (
                    <div className="px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
                    </div>
                )}

                <div className="px-5 py-4">{children}</div>

                {footer && (
                    <div className="px-5 py-3 border-t border-[var(--color-border)]">{footer}</div>
                )}
            </div>
        </div>
    );
}
