import { Toaster } from 'sonner';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { ApiProvider } from './contexts/ApiContext';
import { ModalProvider } from './contexts/ModalContext';
import { PdfCacheProvider } from './contexts/PdfCacheContext';
import { ScrollPersistenceProvider } from './contexts/ScrollPersistenceContext';
import Layout from './components/layout/Layout';
import AppContent from './AppContent.tsx';
import { ViewNavigationProvider } from "@/contexts/NavigationContext.tsx";

function App() {
  return (
    <>
    <Toaster richColors position="top-right" closeButton />
    <AppProvider>
      <AuthProvider>
        <ViewNavigationProvider>
          <PdfCacheProvider>
            <ScrollPersistenceProvider>
              <ApiProvider>
                <ModalProvider>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ModalProvider>
              </ApiProvider>
            </ScrollPersistenceProvider>
          </PdfCacheProvider>
        </ViewNavigationProvider>
      </AuthProvider>
    </AppProvider>
    </>
  );
}

export default App;