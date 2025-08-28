import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/landing.tsx"),
  route("/marketplace", "routes/marketplace.tsx"),
  route("/login", "routes/login.tsx"),
  route("/projects", "routes/projects.tsx"),
  route("/project/:id", "routes/project.$id.tsx", [
    index("components/timeline/MediaBin.tsx"),
    route("text-editor", "components/media/TextEditor.tsx"),
    route("media-bin", "components/timeline/MediaBinPage.tsx"),
    route("transitions", "components/media/Transitions.tsx"),
  ]),
  route("/api/auth/*", "routes/api.auth.$.tsx"),
  route("/api/projects/*", "routes/api.projects.$.tsx"),
  route("/api/assets/*", "routes/api.assets.$.tsx"),
  route("/api/storage/*", "routes/api.storage.$.tsx"),
  route("/learn", "routes/learn.tsx"),
  route("/roadmap", "routes/roadmap.tsx"),
  route("/privacy", "routes/privacy.tsx"),
  route("/terms", "routes/terms.tsx"),
  route("*", "./NotFound.tsx"),
] satisfies RouteConfig;
