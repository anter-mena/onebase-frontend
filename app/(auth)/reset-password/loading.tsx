import { AuthFooter } from "@/components/auth/authFooter";
import { ResetPasswordSkeleton } from "@/components/reset-password/resetPasswordSkeleton";

/** Reset password while it loads: the page's frame, then whichever face the link asks for (resetPasswordSkeleton.tsx). */
export default function ResetPasswordLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background" role="status" aria-label="Loading">
      <main className="flex flex-1 items-center justify-center px-6 py-16 md:px-10">
        <ResetPasswordSkeleton />
      </main>
      <AuthFooter />
    </div>
  );
}
