import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewEntry from "./pages/NewEntry";
import Protocol from "./pages/Protocol";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { useAutoBackup } from "./hooks/use-auto-backup";

const queryClient = new QueryClient();

const AppContent = () => {
  useAutoBackup();

  return (
    <>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/new-entry" element={<Layout><NewEntry /></Layout>} />
          <Route path="/protocol" element={<Layout><Protocol /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
