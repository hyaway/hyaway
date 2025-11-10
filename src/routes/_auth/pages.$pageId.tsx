import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/pages/$pageId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  return (
    <Container>
      <Heading>{pageId}</Heading>
    </Container>
  );
}
