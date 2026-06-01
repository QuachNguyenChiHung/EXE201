import { CompositeContract } from '../types/renter';

/**
 * Centralized rental contract mock data.
 * Starts empty — contracts are created through the owner's CreateContract flow.
 */
export const MockCompositeContracts: CompositeContract[] = [];

/** Helper selectors */
export const getContractsByRenter = (id_renter: number) =>
  MockCompositeContracts.filter(c => c.id_renter === id_renter);

export const getContractsByWarehouse = (warehouseId: string | number) =>
  MockCompositeContracts.filter(c => c.warehouseId == warehouseId);

export const getContractsByOwnerWarehouses = (warehouseIds: (string | number)[]) =>
  MockCompositeContracts.filter(c => c.warehouseId && warehouseIds.includes(c.warehouseId as any));