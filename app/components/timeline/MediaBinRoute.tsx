import MediaBin from "./MediaBin";
import { useOutletContext } from "react-router";

export default function MediaBinRoute() {
	const context = useOutletContext();
	// Simply reuse the index route component with the same context
	// This avoids duplicate route id while providing a concrete element for /editor/media-bin
	// @ts-expect-error: runtime context shape is provided by parent Outlet
	return <MediaBin />;
}
