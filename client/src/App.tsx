import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./hooks/use-theme";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import GalleryPage from "@/pages/GalleryPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gallery" component={GalleryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: "glass",
              duration: 3000,
              style: {
                backgroundColor: "var(--card-background)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }
            }}
          />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
