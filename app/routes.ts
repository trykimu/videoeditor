import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/home.tsx", [
        index("components/timeline/MediaBin.tsx"),
        route("/text-editor", "components/media/TextEditor.tsx"),
        route("/transitions", "components/media/Transitions.tsx"),
        route("/media-bin", "components/redirects/mediaBinLoader.ts"),
    ]),
    route("/learn", "routes/learn.tsx"),
    route("*", "./NotFound.tsx")
] satisfies RouteConfig;
