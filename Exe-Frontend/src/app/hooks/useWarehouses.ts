import { useEffect, useMemo, useState } from 'react'
import { certTypesAPI } from '../../services/apiClient'
import { useApp } from '../../context/AppContext'
import { toast } from 'sonner'
import type { ColdStorage, Certification, CertificationType } from '../../types'

export default function useWarehouses(tab: string, search: string) {
    const { users, warehouses: warehouseList, updateWarehouse, deleteWarehouse } = useApp()

    const [certTypes, setCertTypes] = useState<CertificationType[]>([])
    const [certTypesLoading, setCertTypesLoading] = useState(false)
    const [approveTarget, setApproveTarget] = useState<ColdStorage | null>(null)

    useEffect(() => {
        let mounted = true
        setCertTypesLoading(true)
        certTypesAPI.getAll().then(res => { if (mounted) setCertTypes(res || []) }).catch(() => { }).finally(() => { if (mounted) setCertTypesLoading(false) })
        return () => { mounted = false }
    }, [])

    const ownerEmailMap = useMemo(() => {
        const m: Record<string, string> = {}
        users.forEach(u => { if (u.id) m[u.id] = u.email || '' })
        return m
    }, [users])

    const filtered = useMemo(() => {
        return (warehouseList || []).filter(w => {
            if (tab !== 'all' && w.status !== tab) return false
            if (!search) return true
            const q = search.toLowerCase()
            return w.name.toLowerCase().includes(q) || (w.location?.city || '').toLowerCase().includes(q)
        })
    }, [warehouseList, tab, search])

    const handleApprove = (w: ColdStorage) => setApproveTarget(w)

    const handleDeactivate = async (w: ColdStorage) => {
        await updateWarehouse(w.id, { status: 'inactive' })
        toast.success('Đã ẩn kho')
    }

    const handleDeleteImmediate = async (w: ColdStorage) => {
        await deleteWarehouse(w.id)
        toast.success('Đã xoá kho')
    }

    const handleApproveConfirm = async (selectedCerts: Certification[]) => {
        if (!approveTarget) return
        const updatedCerts = [...(approveTarget.certifications || []), ...selectedCerts]
        await updateWarehouse(approveTarget.id, { status: 'active', certifications: updatedCerts })
        setApproveTarget(null)
        toast.success('Kho đã được duyệt')
    }

    return {
        certTypes,
        certTypesLoading,
        approveTarget,
        setApproveTarget,
        ownerEmailMap,
        filtered,
        handleApprove,
        handleDeactivate,
        handleDeleteImmediate,
        handleApproveConfirm,
    }
}
