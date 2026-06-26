import { cn } from "@/lib/utils";

export function TraditionalDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center my-8", className)}>
      <svg width="200" height="30" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/50">
        <path d="M0 15H80" stroke="hsl(var(--border))" strokeWidth="1"/>
        <path d="M120 15H200" stroke="hsl(var(--border))" strokeWidth="1"/>
        <circle cx="100" cy="15" r="5" stroke="hsl(var(--accent))" strokeWidth="1.5"/>
        <path d="M90 15 C 92 10, 98 10, 100 15 S 108 20, 110 15" stroke="hsl(var(--accent))" strokeWidth="1" fill="none" />
        <path d="M110 15 C 108 10, 102 10, 100 15 S 92 20, 90 15" stroke="hsl(var(--accent))" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}
