// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

// Polyfills - must be imported before any other code
import "./lib/polyfills/request-idle-callback.ts";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx";
import { ErrorBoundary } from "./components/error-boundary.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { RouteError } from "./components/route-error.tsx";

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();
const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} />
  ),
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
          <RouterProvider router={router} />
        </TanStackQueryProvider.Provider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
