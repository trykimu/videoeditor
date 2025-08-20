import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/landing.tsx"),
    route("/editor", "routes/home.tsx", [
        index("components/timeline/MediaBin.tsx"),
        route("text-editor", "components/media/TextEditor.tsx"),
        route("media-bin", "components/timeline/MediaBinPage.tsx"),
        route("transitions", "components/media/Transitions.tsx"),
    ]),
    route("/api/auth/*", "routes/api.auth.$.tsx"),
    route("/learn", "routes/learn.tsx"),
    route("/roadmap", "routes/roadmap.tsx"),
    route("/privacy", "routes/privacy.tsx"),
    route("*", "./NotFound.tsx")
] satisfies RouteConfig;