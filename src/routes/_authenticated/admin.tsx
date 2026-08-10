import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { getSession, isAdmin } from "@/lib/local-db";

const TABS = [
  { to: "/admin/payments" as const, label: "Payments" },
  { to: "/admin/users" as const, label: "Users" },
  { to: "/admin/redeemcodes" as const, label: "Redeem Codes" },
];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    const user = getSession();
    if (!user) throw redirect({ to: "/auth" });
    if (!isAdmin(user.id)) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm bg-secondary text-primary" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
