import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/controllers")({ component: ControllersLayout });

function ControllersLayout() {
  return <Outlet />;
}
