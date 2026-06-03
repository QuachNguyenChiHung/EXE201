import { USE_MOCK_DATA } from './config';
import { MockUsers as rawMockUsers, MockRenterAccounts as rawMockRenterAccounts, MockOwnerAccounts as rawMockOwnerAccounts, MockEmployeeAccounts as rawMockEmployeeAccounts, findUserById, findUserByEmail } from './mockUsers';
import { MockWarehouseData as rawMockWarehouseData, vietnamProvinces } from './mockWarehouses';
import { MockCompositeRentRequests as rawMockRentRequests, getRequestsByWarehouse, getRequestsByRenter } from './mockRequests';
import { MockCompositeContracts as rawMockRentalContracts, getContractsByRenter, getContractsByWarehouse, getContractsByOwnerWarehouses } from './mockContracts';
import { MockRatings as rawMockRatings, getRatingsByWarehouse, getRatingsByRenter } from './mockRatings';

export const MockUsers = USE_MOCK_DATA ? rawMockUsers : [];
export const MockRenterAccounts = USE_MOCK_DATA ? rawMockRenterAccounts : [];
export const MockOwnerAccounts = USE_MOCK_DATA ? rawMockOwnerAccounts : [];
export const MockEmployeeAccounts = USE_MOCK_DATA ? rawMockEmployeeAccounts : [];
export { findUserById, findUserByEmail };

export const MockWarehouseData = USE_MOCK_DATA ? rawMockWarehouseData : [];
export { vietnamProvinces };

export const MockRentRequests = USE_MOCK_DATA ? rawMockRentRequests : [];
export { getRequestsByWarehouse, getRequestsByRenter };

export const MockRentalContracts = USE_MOCK_DATA ? rawMockRentalContracts : [];
export { getContractsByRenter, getContractsByWarehouse, getContractsByOwnerWarehouses };

export const MockRatings = USE_MOCK_DATA ? rawMockRatings : [];
export { getRatingsByWarehouse, getRatingsByRenter };

export * from './config';
