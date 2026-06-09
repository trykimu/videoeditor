import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("/api/auth/*", "routes/api.auth.$.ts"),
  route("/", "routes/landing.tsx"),
  route("/marketplace", "routes/marketplace.tsx"),
  route("/login", "routes/login.tsx"),
  route("/projects", "routes/projects.tsx"),
  route("/profile", "routes/profile.tsx"),
  route("/project/:id", "routes/home.tsx"),
  route("/learn", "routes/learn.tsx"),
  route("/roadmap", "routes/roadmap.tsx"),
  route("/privacy", "routes/privacy.tsx"),
  route("/terms", "routes/terms.tsx"),
  route("*", "./NotFound.tsx"),
] satisfies RouteConfig;
