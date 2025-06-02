import { OffthreadVideo } from "remotion";


export const MyComp: React.FC<{ videoURL: string }> = ({ videoURL }) => {
    // return <div>Hello {text}!</div>;
    return (
        <>
            <div>
                <OffthreadVideo src={videoURL} />
            </div>
        </>
    )
}; 