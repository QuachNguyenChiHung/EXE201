import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { DataLoader } from './components/DataLoader';

function App() {
  return (
    <DataLoader>
      <RouterProvider router={router} />
      <Toaster />
    </DataLoader>
  );
}

export default App;