import MediaBin from "./MediaBin";
import { useOutletContext } from "react-router";

export default function MediaBinRoute() {
	const context = useOutletContext();
	// Simply reuse the index route component with the same context
	// This avoids duplicate route id while providing a concrete element for /editor/media-bin
	return <MediaBin />;
}
