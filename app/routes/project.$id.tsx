import type { Route } from "./+types/project.$id";
import { useParams, useNavigate, useLoaderData } from "react-router";
import React, { useEffect } from "react";
import TimelineEditor from "./home";
import { auth } from "~/lib/auth.server";
import { loadTimeline } from "~/lib/timeline.store";

export async function loader({ request, params }: Route.LoaderArgs) {
  // SSR gate: verify auth
  try {
    // @ts-ignore
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const uid: string | undefined = session?.user?.id || session?.userId || session?.session?.userId;
    if (!uid) return new Response(null, { status: 302, headers: { Location: "/login" } });
  } catch {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  // Optionally prefetch timeline to hydrate client faster
  const id = params.id as string;
  const timeline = await loadTimeline(id);
  return { timeline };
}

export default function ProjectEditorRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id as string;
  const data = useLoaderData() as { timeline?: any };

  useEffect(() => {
    // Lightweight guard: verify project ownership before showing editor
    (async () => {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { credentials: "include" });
      if (!res.ok) navigate("/projects");
    })();
  }, [id, navigate]);

  // Pass through existing editor; it manages state internally. We injected loader for prefetch.
  return <TimelineEditor />;
}


