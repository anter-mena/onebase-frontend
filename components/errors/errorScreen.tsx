import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, LockKeyhole, SearchX, ShieldAlert, TriangleAlert, Wrench } from "lucide-react";

const errors = {
  401: ["Please sign in. Your session may have expired.", "Continue to One Base."],
  403: ["Access denied. You cannot view this page.", "Ask an administrator for access."],
  404: ["Page not found. This address does not exist.", "Check the address or go back."],
  429: ["Too many requests were made too quickly.", "Please wait and try again."],
  500: ["Something went wrong while loading this page.", "Please go back or try again."],
  503: ["One Base is temporarily unavailable right now.", "Please try again later."],
} as const;

export type ErrorCode = keyof typeof errors;

const icons = {
  401: LockKeyhole,
  403: ShieldAlert,
  404: SearchX,
  429: Clock3,
  500: TriangleAlert,
  503: Wrench,
};

export function ErrorScreen({
  code,
  onRetry,
  onHome,
}: {
  code: ErrorCode;
  onRetry?: () => void;
  onHome?: () => void;
}) {
  const [firstLine, secondLine] = errors[code];
  const Icon = icons[code];
  const hasSecondAction = code === 401 || Boolean(onRetry);
  const actionClassName = "inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className="min-h-svh bg-background">
      <main className="flex min-h-svh items-center justify-center px-6 py-16 md:px-10">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="mb-1 flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
              <Icon className="size-5" aria-hidden />
            </div>
            <p className="text-sm font-bold text-foreground">Error {code}</p>
            <h1 className="text-xs font-normal leading-relaxed text-muted-foreground">
              <span className="block">{firstLine}</span>
              <span className="block">{secondLine}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {onHome ? (
              <button type="button" onClick={onHome} className={actionClassName}>
                <ArrowLeft className="size-3" aria-hidden />
                Go back
              </button>
            ) : (
              <Link href="/" className={actionClassName}>
                <ArrowLeft className="size-3" aria-hidden />
                Go back
              </Link>
            )}
            {hasSecondAction && <span className="h-3 w-px bg-border" aria-hidden />}
            {code === 401 && (
              <Link href="/login" className={actionClassName}>
                Sign in
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            )}
            {onRetry && (
              <button type="button" onClick={onRetry} className={actionClassName}>
                Try again
                <ArrowRight className="size-3" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
