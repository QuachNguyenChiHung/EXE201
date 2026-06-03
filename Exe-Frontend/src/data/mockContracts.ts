import { CompositeContract } from '../types/renter';

/**
 * Centralized rental contract mock data.
 * Starts empty — contracts are created through the owner's CreateContract flow.
 */
export const MockCompositeContracts: CompositeContract[] = [];

/** Helper selectors */
export const getContractsByRenter = (id_renter: number) =>
  MockCompositeContracts.filter(c => c.id_renter === id_renter);

export const getContractsByWarehouse = (id_warehouse: string | number) =>
  MockCompositeContracts.filter(c => c.id_warehouse == id_warehouse);

export const getContractsByOwnerWarehouses = (warehouseIds: (string | number)[]) =>
  MockCompositeContracts.filter(c => c.id_warehouse && warehouseIds.includes(c.id_warehouse as any));