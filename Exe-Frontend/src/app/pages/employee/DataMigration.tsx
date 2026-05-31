import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';

export default function DataMigration() {
  const navigate = useNavigate();
  // This page has been removed as per refactor based on employee.ts changes.
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg" style={{ color: 'var(--color-text)' }}>
          Data migration page has been removed.
        </p>
        <button
          onClick={() => navigate('/employee')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
