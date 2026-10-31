import Link from "next/link";
import { Isotipo } from "@/components/isotipo";
import { cn } from "@/lib/utils";

export function Marca({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 font-heading text-2xl font-extrabold tracking-tight text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
    >
      <Isotipo className="size-8" />
      Arrendú
    </Link>
  );
}
