import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Following from "@/pages/Following";
import Categories from "@/pages/Categories";
import StreamView from "@/pages/StreamView";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/following" component={Following} />
      <Route path="/categories" component={Categories} />
      <Route path="/stream/:id" component={StreamView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
