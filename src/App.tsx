import { StoreProvider } from './lib/store';
import { ToastProvider } from './lib/toast';
import { Layout } from './components/Layout';

function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Layout />
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;
