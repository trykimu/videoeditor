import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { Github, Twitter } from "lucide-react";
import { TbBrandDiscord } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  showBrand?: boolean;
}

export function Navbar({ showBrand = true }: NavbarProps) {
  const [spin, setSpin] = useState(false);
  const [gitHubStars, setGitHubStars] = useState<number>(0);

  useEffect(() => {
    const fetchGitHubStars = async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/trykimu/videoeditor"
        );
        const data = await res.json();
        setGitHubStars(data.stargazers_count || 0);
      } catch (error) {
        console.log("Failed to fetch GitHub stars");
      }
    };

    fetchGitHubStars();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="rounded-xl border-2 border-border/30 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 shadow-[0_8px_30px_rgba(0,0,0,0.15)] px-3 py-2 flex items-center justify-between">
          {/* Fixed width container for brand to prevent layout shift */}
          <div className="w-32 flex items-center justify-start">
            <Link to="/" className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                {showBrand && (
                  <motion.button
                    key="logo"
                    onClick={() => setSpin(true)}
                    className="cursor-pointer"
                    onAnimationEnd={() => setSpin(false)}
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.4, 0.0, 0.2, 1],
                      delay: 0.1,
                    }}
                  >
                    <KimuLogo
                      className={`w-6 h-6 text-foreground ${
                        spin ? "animate-spin" : ""
                      }`}
                    />
                  </motion.button>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {showBrand && (
                  <motion.span
                    key="text"
                    className="font-semibold tracking-tight"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.4, 0.0, 0.2, 1],
                      delay: 0.2,
                    }}
                  >
                    Kimu
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Center navigation - will stay fixed */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            <a
              href="http://deepwiki.com/trykimu/videoeditor/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/marketplace"
              className="hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/trykimu/videoeditor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-muted/20 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>{gitHubStars}</span>
            </a>
            <a
              href="https://twitter.com/trykimu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://discord.gg/24Mt5DGcbx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Join our Discord"
            >
              <TbBrandDiscord className="w-4 h-4" />
            </a>
            <Link to="/login">
              <Button
                size="sm"
                className="h-8 px-3 bg-foreground text-background hover:bg-foreground/90"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
