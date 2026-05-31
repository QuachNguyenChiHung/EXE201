import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export default function SearchInput({ value, onChange, placeholder = '', className }: Props) {
    return (
        <div className={`relative ${className ?? ''}`}>
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 pl-8 pr-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
        </div>
    );
}
