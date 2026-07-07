import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { LayoutProvider } from "@/lib/layout-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { QuickCaptureProvider } from "@/components/quick-capture";
import { NotificationProvider } from "@/components/notification-engine";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LayoutProvider>
        <QueryClientProvider client={queryClient}>
          <WorkspaceProvider>
            <TooltipProvider>
              <QuickCaptureProvider>
                <NotificationProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                  </WouterRouter>
                </NotificationProvider>
              </QuickCaptureProvider>
              <Toaster />
            </TooltipProvider>
          </WorkspaceProvider>
        </QueryClientProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}

export default App;
