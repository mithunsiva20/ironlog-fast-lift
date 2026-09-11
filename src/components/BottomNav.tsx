import { Link } from "@tanstack/react-router";
import { Dumbbell, History, Trophy } from "lucide-react";

const items = [
  { to: "/", label: "Train", icon: Dumbbell },
  { to: "/history", label: "History", icon: History },
  { to: "/records", label: "Records", icon: Trophy },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-accent" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-widest"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
