import { Loader2 } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "~/components/ui/button";

interface AuthOverlayProps {
  isLoading: boolean; // kept for compatibility
  isSigningIn?: boolean;
  onSignIn: () => void;
}

export function AuthOverlay({ isLoading: _isLoading, isSigningIn, onSignIn }: AuthOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background/95 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center p-6 rounded-xl border border-border/30 bg-background/50">
          <div className="text-2xl font-semibold mb-2">Code with Kimu</div>
          <p className="text-sm text-muted-foreground mb-2">
            Please log in to use the alpha editor.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Kimu is a minimal, AI‑assisted video editor focused on speed and clarity. We don’t post
            anything on your behalf. Signing in only creates a private account for saving your
            projects and enabling secure access.
          </p>
          <Button onClick={onSignIn} disabled={!!isSigningIn} className="inline-flex items-center gap-2">
            {isSigningIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <FaGoogle className="h-4 w-4" />
                Continue with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


