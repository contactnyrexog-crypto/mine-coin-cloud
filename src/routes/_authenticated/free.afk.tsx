import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { claimAfk, startAfk } from "@/lib/free.functions";
import { Button } from "@/components/ui/button";
import { AFK_COINS_PER_MINUTE } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/free/afk")({
  component: AfkPage,
});

function AfkPage() {
  const start = useServerFn(startAfk);
  const claim = useServerFn(claimAfk);
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [earned, setEarned] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function begin() {
    await start({});
    setRunning(true);
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  }

  async function doClaim() {
    try {
      const res = await claim({});
      setEarned((e) => e + res.awarded);
      setSeconds(0);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`+${res.awarded} coins`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim");
    }
  }

  const minutes = Math.floor(seconds / 60);

  return (
    <div className="panel mx-auto max-w-xl p-8 text-center">
      <h2 className="font-display text-2xl font-bold">AFK Rewards</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Stay on this page. You earn {AFK_COINS_PER_MINUTE} coins every full minute — claim at least once every 10
        minutes.
      </p>

      <p className="mt-8 font-display text-6xl font-bold text-primary tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pending: <span className="text-accent">{minutes * AFK_COINS_PER_MINUTE} coins</span> · Session total: {earned}
      </p>

      <div className="mt-8 flex justify-center gap-3">
        {!running ? (
          <Button onClick={begin}>Start AFK</Button>
        ) : (
          <Button variant="secondary" onClick={stop}>
            Pause
          </Button>
        )}
        <Button variant="outline" onClick={doClaim} disabled={minutes < 1}>
          Claim coins
        </Button>
      </div>
    </div>
  );
}
