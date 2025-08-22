import MediaBin from "./MediaBin";
import { useOutletContext } from "react-router";

export default function MediaBinPage() {
	// Pass through the existing Outlet context provided by the parent route
	// so MediaBin receives its props as in the index route.
	useOutletContext();
	return <MediaBin />;
}
