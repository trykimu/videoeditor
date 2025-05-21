import { Player } from "@remotion/player";
import { useMemo, useState } from "react";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
} from "./remotion/constants.mjs";
import "./app.css";
import { z } from "zod";
import { Main } from "./remotion/components/Main";
import { RenderControls } from "./components/RenderControls";
import { CompositionProps } from "./remotion/schemata";

export default function Index() {
  const [text, setText] = useState("React Router + Remotion 111");

  const inputProps: z.infer<typeof CompositionProps> = useMemo(() => {
    return {
      title: text,
    };
  }, [text]);

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
          <Player
            component={Main}
            inputProps={inputProps}
            durationInFrames={DURATION_IN_FRAMES}
            fps={COMPOSITION_FPS}
            compositionHeight={COMPOSITION_HEIGHT}
            compositionWidth={COMPOSITION_WIDTH}
            style={{
              // Can't use tailwind class for width since player's default styles take presedence over tailwind's,
              // but not over inline styles
              width: "100%",
            }}
            controls
            autoPlay
            loop
          />
        </div>
        {/* <RenderControls
          text={text}
          setText={setText}
          inputProps={inputProps}
        ></RenderControls> */}
        <input
          type="text"
          name="text"
          id="text"
          className="border-2 border-gray-300 rounded-md p-2"
          onChange={(e) => setText(e.target.value)}
        />
        <button 
          className="bg-blue-500 text-white p-2 rounded-md"
          onClick={async () => {
            await fetch("http://localhost:8000/render", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ title: text })
            });
          }}
        >
          render
        </button>
        {/* <button
          onClick={async () => {
            const res = await fetch("http://localhost:8000/render", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ title: text }),
            });

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "video.mp4";
            a.click();
          }}
        >
          Render & Download
        </button> */}
      </div>
    </div>
  );
}
