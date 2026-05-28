import { RentalContract } from '../types';

/**
 * Centralized rental contract mock data.
 * Starts empty — contracts are created through the owner's CreateContract flow.
 */
export const MockRentalContracts: RentalContract[] = [];

/** Helper selectors */
export const getContractsByRenter = (renterId: string) =>
  MockRentalContracts.filter(c => c.renterId === renterId);

export const getContractsByWarehouse = (warehouseId: string) =>
  MockRentalContracts.filter(c => c.warehouseId === warehouseId);

export const getContractsByOwnerWarehouses = (warehouseIds: string[]) =>
  MockRentalContracts.filter(c => warehouseIds.includes(c.warehouseId));