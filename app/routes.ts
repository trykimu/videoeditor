import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./editor.tsx"),
  route("/home", "./home.tsx"),
  // route("/index.html", "./home.tsx"),
  // route("/api/lambda/progress", "./progress.tsx"),
  // route("/api/lambda/render", "./render.tsx"),
  route("*", "./NotFoundPage.tsx") // Catch-all route
] satisfies RouteConfig;
