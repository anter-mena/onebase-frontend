import { AuthFooter } from "@/components/auth/authFooter";
import {
  AuthFieldSkeleton,
  AuthFormSkeleton,
  BackToLogin,
  LinkExpirySkeleton,
} from "@/components/auth/authFormSkeleton";
import { Line } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Join One Base while it loads — accept-invite/page.tsx and acceptInviteForm.tsx
 * at their real sizes. The heading is grey: who the invitation is for and as
 * which role come from checking the link. Then first and last name side by
 * side, the password with its strength line, the confirmation, the button,
 * "Back to login", and the link's expiry.
 */
export default function AcceptInviteLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background" role="status" aria-label="Loading">
      <main className="flex flex-1 items-center justify-center px-6 py-16 md:px-10">
        <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center" aria-hidden>
            <Skeleton className="mb-1 size-9 rounded-lg" />
            <Line className="text-lg" width="w-32" />
            <div className="flex w-full flex-col items-center">
              <Line className="text-xs" width="w-60" />
              <Line className="text-xs" width="w-52" />
              <Line className="text-xs" width="w-24" />
            </div>
          </div>
          <AuthFormSkeleton>
            <div className="grid grid-cols-2 gap-3">
              <AuthFieldSkeleton labelWidth="w-16" />
              <AuthFieldSkeleton labelWidth="w-16" />
            </div>
            <AuthFieldSkeleton strength labelWidth="w-16" />
            <AuthFieldSkeleton labelWidth="w-28" />
          </AuthFormSkeleton>
          <BackToLogin />
          <LinkExpirySkeleton />
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
