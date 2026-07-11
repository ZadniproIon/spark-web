import { StoreProvider } from './lib/store';
import { Layout } from './components/Layout';

function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  );
}

export default App;
