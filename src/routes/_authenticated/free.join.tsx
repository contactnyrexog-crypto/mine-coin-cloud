import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { claimJoinReward } from "@/lib/free.functions";
import { JOIN_REWARDS } from "@/lib/constants";
import { useProfile } from "./free";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/free/join")({
  component: JoinPage,
});

function JoinPage() {
  const claim = useServerFn(claimJoinReward);
  const qc = useQueryClient();
  const { data } = useProfile();
  const [busy, setBusy] = useState("");

  async function doClaim(server: "nethost" | "mentionhost") {
    setBusy(server);
    try {
      await claim({ data: { server } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("+50 coins");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {JOIN_REWARDS.map((r) => {
        const claimed =
          r.key === "nethost" ? data?.profile?.joined_nethost : data?.profile?.joined_mentionhost;
        return (
          <div key={r.key} className="panel flex flex-col gap-4 p-6">
            <h2 className="font-display text-xl font-bold">{r.label}</h2>
            <p className="text-sm text-muted-foreground">
              Join our Discord server and claim <span className="text-accent">{r.coins} coins</span>. One claim per
              account.
            </p>
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open Discord invite <ExternalLink className="size-3.5" />
            </a>
            <Button
              className="mt-auto"
              disabled={Boolean(claimed) || busy === r.key}
              onClick={() => doClaim(r.key as "nethost" | "mentionhost")}
            >
              {claimed ? "Already claimed" : busy === r.key ? "Claiming…" : `Claim ${r.coins} coins`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
