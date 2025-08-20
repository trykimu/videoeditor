import React, { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { FPS } from "../timeline/types";
import { generateUUID } from "~/utils/uuid";

// Data router loader (no data needed, ensures route is compatible with data router)
export function loader() {
    return null;
}

type TransitionType = {
    type: "fade" | "wipe" | "clockWipe" | "slide" | "flip" | "iris";
    name: string;
    description: string;
};

const transitionTypes: TransitionType[] = [
    {
        type: "fade",
        name: "fade()",
        description: "Animate the opacity of the scenes",
    },
    {
        type: "slide",
        name: "slide()",
        description: "Slide in and push out the previous scene",
    },
    {
        type: "wipe",
        name: "wipe()",
        description: "Slide over the previous scene",
    },
    {
        type: "flip",
        name: "flip()",
        description: "Rotate the previous scene",
    },
    {
        type: "clockWipe",
        name: "clockWipe()",
        description: "Reveal the new scene in a circular movement",
    },
    {
        type: "iris",
        name: "iris()",
        description: "Reveal the scene through a circular mask from center",
    },
];

const TransitionThumbnail = ({ transition, isSelected, onClick }: {
    transition: TransitionType;
    isSelected: boolean;
    onClick: () => void;
}) => {
    const handleDragStart = (e: React.DragEvent) => {
        const transitionData = {
            id: generateUUID(),
            type: "transition",
            presentation: transition.type,
            timing: "linear",
            durationInFrames: 1 * FPS,
            leftScrubberId: null,
            rightScrubberId: null,
        };
        e.dataTransfer.setData("application/json", JSON.stringify(transitionData));
        e.dataTransfer.effectAllowed = "copy";
    };

    const renderTransitionEffect = () => {
        const baseClasses = "absolute rounded-sm";
        
        switch (transition.type) {
            case "fade":
                return (
                    <>
                        <div className={`${baseClasses} w-full h-full bg-blue-500`} />
                        <div className={`${baseClasses} w-full h-full bg-blue-300 opacity-50`} />
                    </>
                );
            case "slide":
                return (
                    <>
                        <div className={`${baseClasses} w-3/4 h-full right-0 bg-pink-400`} />
                        <div className={`${baseClasses} w-3/4 h-full left-0 bg-pink-200`} />
                    </>
                );
            case "wipe":
                return (
                    <>
                        <div className={`${baseClasses} w-full h-full bg-blue-500`} />
                        <div className={`${baseClasses} w-2/3 h-full left-0 bg-blue-300`} />
                    </>
                );
            case "flip":
                return (
                    <>
                        <div className={`${baseClasses} w-full h-full bg-blue-500 transform -skew-y-6`} />
                        <div className={`${baseClasses} w-full h-full bg-blue-300 transform skew-y-6 opacity-70`} />
                    </>
                );
            case "clockWipe":
                return (
                    <>
                        <div className={`${baseClasses} w-full h-full bg-blue-500`} />
                        <div
                            className={`${baseClasses} w-full h-full bg-blue-300`}
                            style={{
                                clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)"
                            }}
                        />
                    </>
                );
            case "iris":
                return (
                    <>
                        <div className={`${baseClasses} w-full h-full bg-blue-500`} />
                        <div
                            className={`${baseClasses} w-full h-full bg-blue-300`}
                            style={{
                                clipPath: "circle(40% at 50% 50%)"
                            }}
                        />
                    </>
                );
        }
    };

    return (
        <Card
            className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:ring-1 hover:ring-border'
                }`}
            onClick={onClick}
            draggable={true}
            onDragStart={handleDragStart}
        >
            <CardContent className="p-3">
                <div className="space-y-2">
                    {/* Thumbnail */}
                    <div className="relative w-full h-16 bg-muted rounded-sm overflow-hidden">
                        {renderTransitionEffect()}
                    </div>

                    {/* Title and description */}
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-primary">
                                {transition.name}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-tight">
                            {transition.description}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function Transitions() {
    const [selectedTransition, setSelectedTransition] = useState<string | null>(null);

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Transitions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {transitionTypes.map((transition) => (
                        <TransitionThumbnail
                            key={transition.type}
                            transition={transition}
                            isSelected={selectedTransition === transition.type}
                            onClick={() => setSelectedTransition(transition.type)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
