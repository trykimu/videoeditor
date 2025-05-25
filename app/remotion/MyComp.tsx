import { Sequence, Img } from "remotion";


export const MyComp: React.FC<{ text: string }> = ({ text }) => {
    // return <div>Hello {text}!</div>;
    return (
        <>
            {/* <Sequence from={150} durationInFrames={120}>
                <p>This is some other text</p>
            </Sequence>
            <Sequence from={150} durationInFrames={120}>
                <p>This is the next text</p>
            </Sequence>
            <Sequence durationInFrames={120}>
                <p>Hello {text}!</p>
            </Sequence>
            <Sequence from={100} durationInFrames={120}>
                <Img src="http://192.168.1.3:8080/pan%20card.jpg" />
            </Sequence> */}
            <div>
                <p>hi</p>
            </div>
        </>
    )
};