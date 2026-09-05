import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/wiring")({ component: WiringLayout });

function WiringLayout() {
  return <Outlet />;
}
