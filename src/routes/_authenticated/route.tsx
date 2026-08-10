import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/local-db";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    const user = getSession();
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user };
  },
  component: () => <Outlet />,
});
