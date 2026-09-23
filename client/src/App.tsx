import LoginPage from "./pages/LoginPage";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import RendasPage from "./pages/RendasPage";
import DespesasPage from "./pages/DespesasPage";
import TransacoesPage from "./pages/TransacoesPage";
import ReservasPage from "./pages/ReservasPage";
import EmprestimosPage from "./pages/EmprestimosPage"; // Importação nova aqui!
import ConfiguracoesPage from "./pages/ConfiguracoesPage";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">{() => (
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      )}</Route>
      
      <Route path="/rendas">{() => (
        <DashboardLayout>
          <RendasPage />
        </DashboardLayout>
      )}</Route>
      
      <Route path="/despesas">{() => (
        <DashboardLayout>
          <DespesasPage />
        </DashboardLayout>
      )}</Route>
      
      <Route path="/transacoes">{() => (
        <DashboardLayout>
          <TransacoesPage />
        </DashboardLayout>
      )}</Route>
      
      <Route path="/reservas">{() => (
        <DashboardLayout>
          <ReservasPage />
        </DashboardLayout>
      )}</Route>

      {/* Rota de Empréstimos nova adicionada aqui! */}
      <Route path="/emprestimos">{() => (
        <DashboardLayout>
          <EmprestimosPage />
        </DashboardLayout>
      )}</Route>

      {/* Rota de configurações agora está abraçada pelo layout! */}
      <Route path="/configuracoes">{() => (
        <DashboardLayout>
          <ConfiguracoesPage />
        </DashboardLayout>
      )}</Route>
      
      {/* Caso tenha a rota NotFound no final, não esqueça dela: */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;