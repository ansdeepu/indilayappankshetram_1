import { cn } from "@/lib/utils";

export const TempleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("w-8 h-8", className)}
    {...props}
  >
    <path d="M4 22h16" />
    <path d="M6 22V12" />
    <path d="M18 22V12" />
    <path d="M6 12h12" />
    <path d="M7 12l5-4 5 4" />
    <path d="M9 12V9" />
    <path d="M15 12V9" />
    <path d="M12 9V6.5" />
    <path d="M10 6.5h4" />
    <path d="M12 6.5 L 12 4" />
    <path d="M11 4h2" />
  </svg>
);
