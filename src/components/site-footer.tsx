import { Link } from "@tanstack/react-router";
import { MENTIONHOST_DISCORD, NETHOST_DISCORD } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">
            <span className="text-primary">NETHOST</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            NETHOST — in partnership with Mention Host. Free game panels, budget & premium Minecraft hosting and
            high-memory VPS.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Communities</p>
          <a href={NETHOST_DISCORD} target="_blank" rel="noreferrer" className="block text-muted-foreground hover:text-primary">
            NetHost Discord
          </a>
          <a
            href={MENTIONHOST_DISCORD}
            target="_blank"
            rel="noreferrer"
            className="block text-muted-foreground hover:text-primary"
          >
            Mention Host Discord
          </a>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Legal</p>
          <Link to="/terms" className="block text-muted-foreground hover:text-primary">
            Terms of Service
          </Link>
          <Link to="/privacy" className="block text-muted-foreground hover:text-primary">
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NETHOST. All rights reserved.
      </div>
    </footer>
  );
}
