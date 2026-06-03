/**
 * Backward-compatibility shim.
 * Only re-exports static reference data (provinces, features) used by form components.
 * All seed data lives in /src/data/ and is ONLY used by DataLoader/DataMigration for initialization.
 */
export {
  
  vietnamProvinces,
} from '../data/mockWarehouses';
