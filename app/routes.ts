import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/home.tsx", [
        route("/text-editor", "components/media/TextEditor.tsx"),
        route("/media-bin", "components/timeline/MediaBin.tsx"),
    ]),
    route("/learn", "routes/learn.tsx"),
    route("*", "./NotFound.tsx")
] satisfies RouteConfig;
