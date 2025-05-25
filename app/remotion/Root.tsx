// import React from 'react';
// import { Composition } from 'remotion';
// import { MyComposition } from './Composition';

// export const RemotionRoot: React.FC = () => {
//     return (
//         <>
//             <Composition
//                 id="Empty"
//                 component={MyComposition}
//                 durationInFrames={60}
//                 fps={30}
//                 width={1280}
//                 height={720}
//             />
//         </>
//     );
// };

import { Composition } from 'remotion';
import { MyComp } from './MyComp';

export const MyVideo = () => {
    return (
        <>
            <Composition component={MyComp} durationInFrames={120} width={1920} height={1080} fps={30} id="my-comp" defaultProps={{ text: 'World' }} />
        </>
    );
};