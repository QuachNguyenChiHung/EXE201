import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import type { User } from '../../types'

export default function useUsers(tab: string, search: string) {
    const { users, warehouses: warehouseList, requests: requestList, adminUpdateUser } = useApp()

    const warehousesByOwner = useMemo(() =>
        warehouseList.reduce((acc, w) => { acc[w.id_owner || 0] = (acc[w.id_owner || 0] ?? 0) + 1; return acc }, {} as Record<number, number>),
        [warehouseList])

    const requestsByRenter = useMemo(() =>
        requestList.reduce((acc, r) => { acc[r.id_renter || 0] = (acc[r.id_renter || 0] ?? 0) + 1; return acc }, {} as Record<number, number>),
        [requestList])

    const filtered = useMemo(() => {
        let list: User[] = users
        if (tab !== 'all') list = list.filter(u => u.role === tab)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.hash_tax_code?.toLowerCase().includes(q) ?? false),
            )
        }
        return list
    }, [users, tab, search])

    const counts = useMemo(() => ({
        all: users.length,
        renter: users.filter(u => u.role === 'renter').length,
        warehouse: users.filter(u => u.role === 'warehouse').length,
        employee: users.filter(u => u.role === 'employee').length,
    }), [users])

    const handleSaveEdit = async (id: number, updates: Partial<User>) => {
        await adminUpdateUser(id, updates)
    }

    return { warehousesByOwner, requestsByRenter, filtered, counts, handleSaveEdit }
}
