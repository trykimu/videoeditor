import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useMatches,
} from "react-router";
import { useEffect, useState } from "react";

import "./app.css";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import { auth } from "~/lib/auth.server";
import { Navbar } from "~/components/ui/Navbar";
import { MarketingFooter } from "~/components/ui/MarketingFooter";
import type { User } from "better-auth";

export const links = () => [
  { rel: "icon", href: "/favicon.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: { request: Request }) {
  try {
    // @ts-ignore
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const user = session?.user || null;
    return { user };
  } catch {
    return { user: null };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="d8ab00c1-6fa6-4aad-b152-e14e178c0f24" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <main className="min-h-screen w-full overflow-x-hidden">{children}</main>
          <Toaster position="top-right" expand={false} richColors closeButton />
          <ScrollRestoration />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>() as { user: User };
  const location = useLocation();
  const matches = useMatches();
  const [showBrand, setShowBrand] = useState(true);
  const isNotFound = (matches[matches.length - 1]?.id || "").includes("NotFound");
  const hideNavbar =
    isNotFound ||
    location.pathname === "/projects" ||
    location.pathname.startsWith("/project/") ||
    location.pathname === "/profile";
  const hideFooter =
    isNotFound ||
    location.pathname === "/projects" ||
    location.pathname.startsWith("/project/") ||
    location.pathname === "/profile";

  useEffect(() => {
    // Only apply hero intersection logic on the landing page
    if (location.pathname === "/") {
      const hero = document.getElementById("hero-section");
      if (!hero) {
        setShowBrand(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          setShowBrand(!e.isIntersecting);
        },
        { root: null, threshold: 0.25 },
      );
      observer.observe(hero);
      return () => observer.disconnect();
    } else {
      // On other pages, always show the brand
      setShowBrand(true);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Expose initial auth user to the client to avoid extra roundtrips/flicker */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__AUTH_USER__ = ${JSON.stringify(data?.user ?? null)};`,
        }}
      />
      {!hideNavbar && <Navbar showBrand={showBrand} />}
      <Outlet />
      {!hideFooter && <MarketingFooter />}
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (process.env.NODE_ENV === "development" && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
