import { useCallback, useEffect, useMemo, useState } from 'react'
import { certTypesAPI } from '../../services/apiClient'
import { toast } from 'sonner'
import type { CertificationType } from '../../types'

export default function useCertTypes(search: string) {
    const [certTypes, setCertTypes] = useState<CertificationType[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const items = await certTypesAPI.getAll()
            setCertTypes((items || []).sort((a, b) => a.label.localeCompare(b.label)))
        } catch (err: any) {
            console.error('Failed to fetch cert types:', err)
            toast.error('Không tải được danh sách loại chứng nhận')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const createType = useCallback(async (data: CertificationType) => {
        setSaving(true)
        try {
            await certTypesAPI.create(data)
            toast.success('Đã thêm loại chứng nhận mới')
            await fetchData()
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`)
        } finally { setSaving(false) }
    }, [fetchData])

    const updateType = useCallback(async (id: number, data: Partial<CertificationType>) => {
        setSaving(true)
        try {
            await certTypesAPI.update(id, data)
            toast.success('Đã cập nhật loại chứng nhận')
            await fetchData()
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`)
        } finally { setSaving(false) }
    }, [fetchData])

    const deleteType = useCallback(async (id: number) => {
        try {
            await certTypesAPI.delete(id)
            toast.success('Đã xóa loại chứng nhận')
            await fetchData()
        } catch (err: any) {
            toast.error(`Lỗi xóa: ${err.message}`)
        }
    }, [fetchData])

    const filtered = useMemo(() => {
        if (!search.trim()) return certTypes
        const q = search.toLowerCase()
        return certTypes.filter(ct => 
          ct.label.toLowerCase().includes(q) || 
          (ct.law_references && ct.law_references.toLowerCase().includes(q))
        )
    }, [certTypes, search])

    return { certTypes, loading, saving, fetchData, createType, updateType, deleteType, filtered }
}
