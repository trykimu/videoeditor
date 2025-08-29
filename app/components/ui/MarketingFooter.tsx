import * as React from "react";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function MarketingFooter() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      // Placeholder – integrate with your waitlist backend later
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Thanks! We'll keep you posted.");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-end">
      <div className="relative bg-white text-black overflow-hidden">
        {/* Black cap with rounded bottom corners */}
        <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 bg-background rounded-b-[3rem] pointer-events-none" />
        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(0,0,0,0.06),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.05),transparent_45%)]" />

        {/* Footer Links Section */}
        <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-[40vw] sm:pb-[32vw] md:pb-[22vw] grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-y-12 gap-x-12 md:gap-x-16 font-mono">
          {/* Left column + Waitlist & Newsletter */}
          <div className="flex flex-col space-y-6 md:col-span-5 font-sans min-w-0">
            <KimuLogo className="w-10 h-10 text-black" />
            <div className="mt-10 max-w-md">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="text-[11px] uppercase tracking-[0.15em] text-black/60 mb-4">
                  Waitlist & Newsletter
                </div>
                <div className="relative flex items-center">
                  <div className="flex-1 border-b border-black/50">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent outline-none border-0 text-3xl leading-none placeholder:text-black/30 text-black"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="ml-3 h-8 w-8 rounded-full bg-black text-white grid place-items-center disabled:opacity-50 shrink-0"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* The Good */}
          <div className="md:col-start-7 md:col-span-2">
            <h3 className="font-semibold mb-3 uppercase">The Good</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:underline">Home</a></li>
              <li><a href="http://deepwiki.com/trykimu/videoeditor/" target="_blank" rel="noreferrer" className="hover:underline">Docs</a></li>
              <li>
                <div className="inline-flex items-center gap-2">
                  <span>Plugins</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-black/40 text-black/70">Coming soon</span>
                </div>
              </li>
            </ul>
          </div>

          {/* The Boring */}
          <div className="md:col-start-9 md:col-span-2">
            <h3 className="font-semibold mb-3 uppercase">The Boring</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/terms" className="hover:underline">Terms of Use</a></li>
              <li><a href="/privacy" className="hover:underline">Play by the Rules</a></li>
            </ul>
          </div>

          {/* The Cool */}
          <div className="md:col-start-11 md:col-span-2">
            <h3 className="font-semibold mb-3 uppercase">The Cool</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://twitter.com/trykimu" target="_blank" rel="noreferrer" className="hover:underline">X</a></li>
              <li><a href="https://github.com/trykimu/videoeditor" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a></li>
              <li><a href="https://discord.gg/24Mt5DGcbx" target="_blank" rel="noreferrer" className="hover:underline">Discord</a></li>
            </ul>
          </div>
        </footer>

        {/* Big KIMU wordmark pinned to the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none z-0">
          <h1 className="text-[16vw] md:text-[18vw] font-extrabold leading-none text-black/10 select-none tracking-tight">TRYKIMU</h1>
        </div>
      </div>
    </div>
  );
}


