import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hello-world")({
  component: HelloWorldComponent,
});

function HelloWorldComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl">Hello World!</h1>
    </div>
  );
}
