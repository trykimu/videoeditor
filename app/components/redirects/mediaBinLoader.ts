export function loader() {
  return null;
}

export default function MediaBinRedirectPlaceholder() {
  // This component is never rendered because MediaBin is the index route.
  // Keeping a placeholder avoids duplicate route IDs with the index element.
  return null;
}
