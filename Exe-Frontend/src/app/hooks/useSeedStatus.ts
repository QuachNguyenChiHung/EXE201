import { useCallback, useEffect, useRef, useState } from 'react'
import { seedAPI } from '../../services/apiClient'
import { MockUsers } from '../../data/mockUsers'
import { MockWarehouseData } from '../../data/mockWarehouses'
import { MockRentRequests } from '../../data/mockRequests'
import { MockRentalContracts } from '../../data/mockContracts'
import { MockRatings } from '../../data/mockRatings'
import { useApp } from '../../context/AppContext'
import type { LogEntry, LogLevel, ResourceDef, ResourceKey, ResourceStatus } from '../../types'

const RESOURCES: ResourceDef[] = [
    { key: 'users', label: 'Người dùng', color: '#2563eb', mockData: MockUsers, reduxKey: 'auth.users' },
    { key: 'warehouses', label: 'Kho lạnh', color: '#7c3aed', mockData: MockWarehouseData, reduxKey: 'warehouses.list' },
    { key: 'requests', label: 'Yêu cầu thuê', color: '#0891b2', mockData: MockRentRequests, reduxKey: 'requests.list' },
    { key: 'contracts', label: 'Hợp đồng', color: '#059669', mockData: MockRentalContracts, reduxKey: 'contracts.list' },
    { key: 'ratings', label: 'Đánh giá', color: '#d97706', mockData: MockRatings, reduxKey: 'ratings.list' },
]

export default function useSeedStatus() {
    const { refreshUsers, refreshWarehouses, refreshRequests, refreshContracts, refreshRatings } = useApp()

    const [status, setStatus] = useState<Record<ResourceKey, ResourceStatus>>({
        users: { kvCount: 0, migrating: false, clearing: false },
        warehouses: { kvCount: 0, migrating: false, clearing: false },
        requests: { kvCount: 0, migrating: false, clearing: false },
        contracts: { kvCount: 0, migrating: false, clearing: false },
        ratings: { kvCount: 0, migrating: false, clearing: false },
    })
    const [seededAt, setSeededAt] = useState<string | null>(null)
    const [loadingStatus, setLoadingStatus] = useState(true)
    const [migratingAll, setMigratingAll] = useState(false)
    const [clearingAll, setClearingAll] = useState(false)
    const [forceOverwrite, setForceOverwrite] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const logRef = useRef<HTMLDivElement | null>(null)

    const addLog = useCallback((level: LogLevel, msg: string) => {
        const entry: LogEntry = { ts: new Date().toLocaleTimeString('vi-VN'), level, msg }
        setLogs(prev => [entry, ...prev].slice(0, 100))
    }, [])

    const updateStatus = useCallback((key: ResourceKey, patch: Partial<ResourceStatus>) => {
        setStatus(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    }, [])

    const refreshStatus = useCallback(async (silent = false) => {
        if (!silent) setLoadingStatus(true)
        try {
            const data = await seedAPI.status()
            setSeededAt(data.seededAt)
            RESOURCES.forEach(r => {
                updateStatus(r.key, { kvCount: data.counts[r.key] ?? 0, error: undefined })
            })
            if (!silent) addLog('info', `Làm mới trạng thái KV: ${JSON.stringify(data.counts)}`)
        } catch (err: any) {
            addLog('error', `Không lấy được trạng thái KV: ${err.message}`)
        } finally {
            if (!silent) setLoadingStatus(false)
        }
    }, [addLog, updateStatus])

    useEffect(() => { refreshStatus() }, [refreshStatus])

    useEffect(() => {
        const anyBusy = Object.values(status).some(s => s.migrating || s.clearing) || migratingAll || clearingAll
        if (!anyBusy) return
        const id = setInterval(() => refreshStatus(true), 2000)
        return () => clearInterval(id)
    }, [status, migratingAll, clearingAll, refreshStatus])

    useEffect(() => { logRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [logs])

    const reloadResource = async (key: ResourceKey) => {
        switch (key) {
            case 'users': await refreshUsers(); break
            case 'warehouses': await refreshWarehouses(); break
            case 'requests': await refreshRequests(); break
            case 'contracts': await refreshContracts(); break
            case 'ratings': await refreshRatings(); break
        }
    }

    const reloadAll = async () => {
        addLog('info', 'Đồng bộ Redux từ KV…')
        try {
            await Promise.all(RESOURCES.map(r => reloadResource(r.key)))
            addLog('success', '✓ Đã đồng bộ Redux')
        } catch (err: any) {
            addLog('error', `✗ Đồng bộ Redux: ${err.message}`)
        }
    }

    const migrateResource = async (res: ResourceDef) => {
        updateStatus(res.key, { migrating: true, error: undefined })
        addLog('info', `Bắt đầu migrate ${res.label} (${res.mockData.length} records)…`)
        try {
            const result = await seedAPI.seedResource(res.key, res.mockData, forceOverwrite)
            if (result.status === 'already_exists') {
                addLog('warn', `${res.label}: đã có dữ liệu (${result.count} records). Bật "Force overwrite" để ghi đè.`)
                updateStatus(res.key, { kvCount: result.count as unknown as number })
            } else {
                addLog('success', `✓ ${res.label}: migrate ${result.count} records thành công`)
                updateStatus(res.key, { kvCount: result.count })
            }
            await reloadResource(res.key)
        } catch (err: any) {
            addLog('error', `✗ ${res.label}: ${err.message}`)
            updateStatus(res.key, { error: err.message })
        } finally {
            updateStatus(res.key, { migrating: false })
        }
    }

    const clearResource = async (res: ResourceDef) => {
        if (!confirm(`Xóa tất cả ${res.label} khỏi KV store?`)) return
        updateStatus(res.key, { clearing: true, error: undefined })
        addLog('warn', `Đang xóa ${res.label}…`)
        try {
            const result = await seedAPI.clearResource(res.key)
            addLog('success', `✓ ${res.label}: đã xóa ${result.cleared} records`)
            updateStatus(res.key, { kvCount: 0 })
        } catch (err: any) {
            addLog('error', `✗ ${res.label} clear: ${err.message}`)
            updateStatus(res.key, { error: err.message })
        } finally {
            updateStatus(res.key, { clearing: false })
        }
    }

    const migrateAll = async () => {
        setMigratingAll(true)
        addLog('info', `Bắt đầu migrate toàn bộ dữ liệu (force=${forceOverwrite})…`)
        try {
            const result = await seedAPI.seed({ users: MockUsers, warehouses: MockWarehouseData, requests: MockRentRequests, contracts: MockRentalContracts, ratings: MockRatings }, forceOverwrite)
            if ((result as any).status === 'already_seeded') {
                addLog('warn', 'Dữ liệu đã tồn tại. Bật "Force overwrite" để ghi đè.')
            } else {
                addLog('success', `✓ Migrate all: ${JSON.stringify((result as any).counts)}`)
                setSeededAt(new Date().toISOString())
            }
            await refreshStatus(true)
            await Promise.all(RESOURCES.map(r => reloadResource(r.key)))
        } catch (err: any) {
            addLog('error', `✗ Migrate all: ${err.message}`)
        } finally {
            setMigratingAll(false)
        }
    }

    const clearAll = async () => {
        if (!confirm('Xóa TẤT CẢ dữ liệu khỏi KV store? Hành động này không thể hoàn tác.')) return
        setClearingAll(true)
        addLog('warn', 'Đang xóa toàn bộ dữ liệu KV…')
        try {
            const result = await seedAPI.clear()
            addLog('success', `✓ ${result.message}`)
            setSeededAt(null)
            await refreshStatus(true)
        } catch (err: any) {
            addLog('error', `✗ Clear all: ${err.message}`)
        } finally {
            setClearingAll(false)
        }
    }

    const anyBusy = Object.values(status).some(s => s.migrating || s.clearing) || migratingAll || clearingAll

    const clearLogs = () => setLogs([])

    return {
        status,
        seededAt,
        loadingStatus,
        migratingAll,
        clearingAll,
        forceOverwrite,
        setForceOverwrite,
        logs,
        logRef,
        addLog,
        updateStatus,
        refreshStatus,
        migrateResource,
        clearResource,
        migrateAll,
        clearAll,
        reloadResource,
        reloadAll,
        anyBusy,
        clearLogs,
        RESOURCES,
    }
}
