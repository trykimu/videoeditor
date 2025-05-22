import { z } from "zod";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  OffthreadVideo,
  staticFile
} from "remotion";
import { ReactRouterLogo } from "./ReactRouterLogo";
// import { loadFont, fontFamily } from "@remotion/google-fonts/Inter";
import React, { useMemo } from "react";
import { Rings } from "./Rings";
import { TextFade } from "./TextFade";
import { CompositionProps } from "../schemata";

const weight = "600" as const;

// loadFont("normal", {
//   weights: ["400", weight],
// });

const container: React.CSSProperties = {
  backgroundColor: "white",
};

const logo: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
};

export const Main = ({ title }: z.infer<typeof CompositionProps>) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const transitionStart = 2 * fps;
  const transitionDuration = 1 * fps;

  const logoOut = spring({
    fps,
    frame,
    config: {
      damping: 200,
    },
    durationInFrames: transitionDuration,
    delay: transitionStart,
  });

  // console.log(`title: ${title}`);

  // const titleStyle: React.CSSProperties = useMemo(() => {
  //   return { fontFamily, fontSize: 70, fontWeight: weight };
  // }, []);

  return (
    // <AbsoluteFill style={container}>
    //   <Sequence durationInFrames={transitionStart + transitionDuration}>
    //     <Rings outProgress={logoOut}></Rings>
    //     <AbsoluteFill style={logo}>
    //       <ReactRouterLogo outProgress={logoOut}></ReactRouterLogo>
    //     </AbsoluteFill>
    //   </Sequence>
    //   <Sequence from={transitionStart + transitionDuration / 2}>
    //     <TextFade>
    //       <h1>{title}</h1>
    //     </TextFade>
    //   </Sequence>
    // </AbsoluteFill>
    <AbsoluteFill style={container}>
      <Sequence from={0} durationInFrames={35}>
        <h1>hello</h1>
      </Sequence>
      <Sequence from={35} durationInFrames={35}>
        <h1>world</h1>
      </Sequence>
      <Sequence from={70} durationInFrames={durationInFrames - 70}>
        {/* <h1 style={titleStyle}>{title}</h1> */}
        <OffthreadVideo src={title} />
      </Sequence>
    </AbsoluteFill>
  );
};
