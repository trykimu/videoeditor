import { Composition, CalculateMetadataFunction } from "remotion";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_ID,
  COMPOSITION_WIDTH,
} from "./constants.mjs";
import { Main } from "./components/Main";

export const RemotionRoot = () => {
  console.log("hi");

  const typedCalculateMetadata: CalculateMetadataFunction<{ title: string }> = async ({ props }) => {
    console.log('aaaaaaaaaaaaaa');
    console.log(props);
    // The 'width' property must be a number.
    return { width: Number(props.title) };
  };

  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={{ title: "stranger" }}
        calculateMetadata={typedCalculateMetadata}
      />
    </>
  );
};
