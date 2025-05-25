import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/learn", "routes/learn.tsx"),
    route("*", "./NotFound.tsx")
] satisfies RouteConfig;
