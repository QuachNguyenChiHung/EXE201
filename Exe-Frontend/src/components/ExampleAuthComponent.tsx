import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, logout, register } from '../../store/slices/authSlice';
import type { LoginCredentials, RegisterData } from '../../model';

/**
 * Example component demonstrating Redux authentication usage
 * This is a reference implementation - customize as needed
 */
export default function ExampleAuthComponent() {
    const dispatch = useAppDispatch();
    const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

    const [loginForm, setLoginForm] = useState<LoginCredentials>({
        email: '',
        password: '',
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(login(loginForm)).unwrap();
            alert('Login successful!');
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await dispatch(logout()).unwrap();
            alert('Logged out successfully!');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '400px' }}>
            <h2>Authentication Example</h2>

            {error && (
                <div style={{ color: 'red', marginBottom: '10px' }}>
                    Error: {error}
                </div>
            )}

            {isAuthenticated ? (
                <div>
                    <h3>Welcome, {user?.name}!</h3>
                    <p>Email: {user?.email}</p>
                    <p>Role: {user?.role}</p>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            Email:
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                required
                                style={{ width: '100%', padding: '5px' }}
                            />
                        </label>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            Password:
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                required
                                style={{ width: '100%', padding: '5px' }}
                            />
                        </label>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            )}
        </div>
    );
}
