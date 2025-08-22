import type { Route } from "./+types/project.$id";
import { useParams, useNavigate } from "react-router";
import React, { useEffect } from "react";
import TimelineEditor from "./home";

export async function loader({ request, params }: Route.LoaderArgs) {
  // Optionally could verify access here by calling our API; keep client guard for now
  return null;
}

export default function ProjectEditorRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id as string;

  useEffect(() => {
    // Lightweight guard: verify project ownership before showing editor
    (async () => {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { credentials: "include" });
      if (!res.ok) navigate("/projects");
    })();
  }, [id, navigate]);

  return <TimelineEditor />;
}


