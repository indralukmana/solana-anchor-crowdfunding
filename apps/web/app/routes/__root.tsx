import * as React from "react";
import {
  Outlet,
  createRootRoute,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { Toaster } from "sonner";
import { WalletButton } from "@/components/solana/wallet-button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 30_000,
    },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Go home
        </Link>
      </div>
    </div>
  ),
});

function RootComponent() {
  const routerState = useRouterState();
  const isLoading = routerState.status === "pending";

  return (
    <QueryClientProvider client={queryClient}>
      <SolanaProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
              <Link to="/" className="text-xl font-semibold tracking-tight">
                Crowdfund
              </Link>
              <nav className="flex items-center gap-6">
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Campaigns
                </Link>
                <Link
                  to="/create"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Create
                </Link>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Profile
                </Link>
                <Link
                  to="/program"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Program
                </Link>
                <WalletButton />
              </nav>
            </div>
          </header>

          <main className="flex-1">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <Outlet />
            )}
          </main>

          <footer className="border-t border-border py-8">
            <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
              Crowdfunding dApp — Built on Solana
            </div>
          </footer>
          <TanStackDevtools
            plugins={[
              { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
              { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
            ]}
          />
        </div>
          <Toaster richColors />
      </SolanaProvider>
    </QueryClientProvider>
  );
}
