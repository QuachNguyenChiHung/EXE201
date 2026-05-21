import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWarehouses, setFilters } from '../../store/slices/warehouseSlice';
import type { Warehouse } from '../../model';

/**
 * Example component demonstrating Redux warehouse usage
 * This is a reference implementation - customize as needed
 */
export default function ExampleWarehouseList() {
    const dispatch = useAppDispatch();
    const { warehouses, loading, error, total, page, totalPages } = useAppSelector(
        (state) => state.warehouse
    );

    useEffect(() => {
        // Load warehouses on component mount
        dispatch(fetchWarehouses({ page: 1, pageSize: 10 }));
    }, [dispatch]);

    const handleSearch = (city: string) => {
        dispatch(setFilters({ city }));
        dispatch(fetchWarehouses({ city, page: 1, pageSize: 10 }));
    };

    const handlePageChange = (newPage: number) => {
        dispatch(fetchWarehouses({ page: newPage, pageSize: 10 }));
    };

    if (loading) {
        return <div>Loading warehouses...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Warehouse List</h2>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search by city..."
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ padding: '5px', width: '200px' }}
                />
            </div>

            <p>Total: {total} warehouses</p>

            <div style={{ display: 'grid', gap: '10px' }}>
                {warehouses.map((warehouse: Warehouse) => (
                    <div
                        key={warehouse.id}
                        style={{
                            border: '1px solid #ccc',
                            padding: '15px',
                            borderRadius: '5px',
                        }}
                    >
                        <h3>{warehouse.name}</h3>
                        <p>{warehouse.description}</p>
                        <p>
                            <strong>Location:</strong> {warehouse.location_city}, {warehouse.location_province}
                        </p>
                        <p>
                            <strong>Capacity:</strong> {warehouse.available_capacity} / {warehouse.total_capacity} m³
                        </p>
                        <p>
                            <strong>Price:</strong> {warehouse.price_per_cubic_meter.toLocaleString()} VND/m³
                        </p>
                        <p>
                            <strong>Status:</strong> {warehouse.availability}
                        </p>
                        {warehouse.rating_score && (
                            <p>
                                <strong>Rating:</strong> ⭐ {warehouse.rating_score.toFixed(1)} ({warehouse.rating_count} reviews)
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        style={{ marginRight: '10px' }}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        style={{ marginLeft: '10px' }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
