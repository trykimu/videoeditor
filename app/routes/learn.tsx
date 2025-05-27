// import { Player } from '@remotion/player';
// import { MyComp } from '~/remotion/MyComp';
// import { useState, useEffect, type ChangeEvent } from 'react';

// export default function Learn() {
//   const [videoURL, setVideoURL] = useState<string | null>(null);

//   const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       if (videoURL && videoURL.startsWith('blob:')) {
//         URL.revokeObjectURL(videoURL);
//       }
//       const newUrl = URL.createObjectURL(file);
//       setVideoURL(newUrl);
//     }
//   };

//   useEffect(() => {
//     // Cleanup function to revoke the object URL when the component unmounts
//     // or when the videoURL changes to a new blob URL.
//     return () => {
//       if (videoURL && videoURL.startsWith('blob:')) {
//         URL.revokeObjectURL(videoURL);
//       }
//     };
//   }, [videoURL]);

//   return (
//     <div>
//       <input
//         type="file"
//         accept="video/*"
//         onChange={handleFileSelect}
//         className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 ease-in-out"
//       />
//       {videoURL && (
//         <Player
//           component={MyComp}
//           inputProps={{ videoURL: videoURL }}
//           durationInFrames={500}
//           compositionWidth={1920}
//           compositionHeight={1080}
//           fps={30}
//           style={{
//             width: 1280,
//             height: 720,
//           }}
//           controls
//         />
//       )}
//     </div>
//   );
// };

import { useEffect, useRef, useState, useCallback } from "react";
// import { Link } from "react-router-dom";
import { Link } from "react-router";
import { Player } from "@remotion/player";
import { AbsoluteFill, Sequence } from "remotion";

// Types for our mini timeline
interface TextElement {
  id: string;
  text: string;
  startTime: number; // in ms
  duration: number; // in ms
  color: string;
  y: number; // track position
}

interface TimelineScale {
  zoom: number;
  unit: number;
  segments: number;
}

interface ResizeState {
  elementId: string;
  isResizing: boolean;
  resizeType: 'left' | 'right';
  startX: number;
  originalStartTime: number;
  originalDuration: number;
}

// Remotion composition for the player
const MyComposition: React.FC<{ elements: TextElement[]; fps: number }> = ({ 
  elements, 
  fps 
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      {elements.map((element) => (
        <Sequence
          key={element.id}
          from={Math.floor(element.startTime / (1000 / fps))}
          durationInFrames={Math.floor(element.duration / (1000 / fps))}
        >
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              color: element.color,
              fontSize: 48,
              fontWeight: 'bold',
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {element.text}
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Learn = () => {
  // Timeline state
  const [elements, setElements] = useState<TextElement[]>([
    {
      id: "1",
      text: "Hello World",
      startTime: 1000,
      duration: 2000,
      color: "#3b82f6",
      y: 0
    },
    {
      id: "2", 
      text: "Learning Timeline",
      startTime: 3500,
      duration: 1500,
      color: "#ef4444",
      y: 1
    }
  ]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [scale, setScale] = useState<TimelineScale>({
    zoom: 0.1,
    unit: 100,
    segments: 5
  });
  const [scrollLeft, setScrollLeft] = useState(0);
  const [snapDistance] = useState(10); // pixels

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Constants
  const TIMELINE_HEIGHT = 300;
  const TRACK_HEIGHT = 60;
  const RULER_HEIGHT = 40;
  const TIMELINE_OFFSET_X = 40;
  const MAX_TIME = 10000; // 10 seconds
  const FPS = 30;

  // Convert time to pixels
  const timeToPixels = useCallback((time: number) => {
    return (time * scale.zoom * scale.unit) / 1000;
  }, [scale]);

  // Convert pixels to time
  const pixelsToTime = useCallback((pixels: number) => {
    return (pixels * 1000) / (scale.zoom * scale.unit);
  }, [scale]);

  // Format time for display
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${milliseconds}s`;
  };

  // Check for element collisions
  const checkCollision = (newElement: TextElement, excludeId?: string): boolean => {
    return elements.some(element => {
      if (element.id === excludeId || element.y !== newElement.y) return false;
      
      const elementStart = element.startTime;
      const elementEnd = element.startTime + element.duration;
      const newStart = newElement.startTime;
      const newEnd = newElement.startTime + newElement.duration;
      
      return !(newEnd <= elementStart || newStart >= elementEnd);
    });
  };

  // Get snap points (ruler marks and element edges)
  const getSnapPoints = (excludeId?: string) => {
    const snapPoints: number[] = [];
    
    // Add ruler marks every second
    for (let time = 0; time <= MAX_TIME; time += 1000) {
      snapPoints.push(time);
    }
    
    // Add element edges
    elements.forEach(element => {
      if (element.id !== excludeId) {
        snapPoints.push(element.startTime);
        snapPoints.push(element.startTime + element.duration);
      }
    });
    
    return snapPoints;
  };

  // Find nearest snap point
  const findSnapPoint = (time: number, excludeId?: string): number => {
    const snapPoints = getSnapPoints(excludeId);
    const timeInPixels = timeToPixels(time);
    
    for (const snapTime of snapPoints) {
      const snapPixels = timeToPixels(snapTime);
      if (Math.abs(timeInPixels - snapPixels) < snapDistance) {
        return snapTime;
      }
    }
    
    return time;
  };

  // Sync player with current time
  useEffect(() => {
    if (playerRef.current) {
      const frame = Math.floor((currentTime / 1000) * FPS);
      playerRef.current.seekTo(frame);
    }
  }, [currentTime]);

  // Handle ruler click
  const handleRulerClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TIMELINE_OFFSET_X + scrollLeft;
    const newTime = Math.max(0, Math.min(MAX_TIME, pixelsToTime(x)));
    const snappedTime = findSnapPoint(newTime);
    setCurrentTime(snappedTime);
  };

  // Handle playhead drag
  const handlePlayheadDrag = useCallback((clientX: number) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left - TIMELINE_OFFSET_X + scrollLeft;
    const newTime = Math.max(0, Math.min(MAX_TIME, pixelsToTime(x)));
    const snappedTime = findSnapPoint(newTime);
    setCurrentTime(snappedTime);
  }, [timelineRef, scrollLeft, pixelsToTime]);

  // Handle element drag start
  const handleElementDragStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setDraggedElement(elementId);
    
    const element = elements.find(el => el.id === elementId);
    if (!element || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TIMELINE_OFFSET_X + scrollLeft;
    const elementX = timeToPixels(element.startTime);
    setDragOffset(x - elementX);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, elementId: string, resizeType: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setResizeState({
      elementId,
      isResizing: true,
      resizeType,
      startX: e.clientX,
      originalStartTime: element.startTime,
      originalDuration: element.duration
    });
  };

  // Handle track change (move element between tracks)
  const handleTrackChange = (elementId: string, newTrackY: number) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    const newElement = { ...element, y: newTrackY };
    
    // Check for collisions on the new track
    if (!checkCollision(newElement, elementId)) {
      setElements(prev => prev.map(el => 
        el.id === elementId ? newElement : el
      ));
    }
  };

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeState?.isResizing) {
        // Handle resizing
        const deltaX = e.clientX - resizeState.startX;
        const deltaTime = pixelsToTime(deltaX);
        
        const element = elements.find(el => el.id === resizeState.elementId);
        if (!element) return;
        
        let newStartTime = resizeState.originalStartTime;
        let newDuration = resizeState.originalDuration;
        
        if (resizeState.resizeType === 'left') {
          newStartTime = Math.max(0, resizeState.originalStartTime + deltaTime);
          newDuration = resizeState.originalDuration - deltaTime;
        } else {
          newDuration = Math.max(100, resizeState.originalDuration + deltaTime); // Min 100ms duration
        }
        
        // Ensure minimum duration
        if (newDuration < 100) return;
        
        // Snap to points
        if (resizeState.resizeType === 'left') {
          newStartTime = findSnapPoint(newStartTime, resizeState.elementId);
          newDuration = resizeState.originalStartTime + resizeState.originalDuration - newStartTime;
        } else {
          const endTime = newStartTime + newDuration;
          const snappedEndTime = findSnapPoint(endTime, resizeState.elementId);
          newDuration = snappedEndTime - newStartTime;
        }
        
        const newElement = { ...element, startTime: newStartTime, duration: newDuration };
        
        // Check for collisions
        if (!checkCollision(newElement, resizeState.elementId)) {
          setElements(prev => prev.map(el => 
            el.id === resizeState.elementId ? newElement : el
          ));
        }
      } else if (draggedElement && timelineRef.current) {
        // Handle dragging
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - TIMELINE_OFFSET_X + scrollLeft - dragOffset;
        const y = e.clientY - rect.top - RULER_HEIGHT;
        
        const newStartTime = Math.max(0, pixelsToTime(x));
        const newTrackY = Math.floor(y / TRACK_HEIGHT);
        const clampedTrackY = Math.max(0, Math.min(2, newTrackY)); // Limit to 3 tracks
        
        const snappedTime = findSnapPoint(newStartTime, draggedElement);
        
        const element = elements.find(el => el.id === draggedElement);
        if (!element) return;
        
        const newElement = { ...element, startTime: snappedTime, y: clampedTrackY };
        
        // Check for collisions
        if (!checkCollision(newElement, draggedElement)) {
          setElements(prev => prev.map(el => 
            el.id === draggedElement ? newElement : el
          ));
        }
      }
    };

    const handleMouseUp = () => {
      setDraggedElement(null);
      setDragOffset(0);
      setResizeState(null);
    };

    if (draggedElement || resizeState?.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedElement, dragOffset, resizeState, elements, timeToPixels, pixelsToTime, scrollLeft, snapDistance]);

  // Add new text element
  const addTextElement = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: "New Text",
      startTime: currentTime,
      duration: 2000,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      y: 0
    };
    
    // Find an available track
    for (let track = 0; track < 3; track++) {
      const testElement = { ...newElement, y: track };
      if (!checkCollision(testElement)) {
        setElements(prev => [...prev, testElement]);
        return;
      }
    }
    
    // If no track is available, add anyway (user can move it)
    setElements(prev => [...prev, newElement]);
  };

  // Render ruler
  const renderRuler = () => {
    const rulerMarks = [];
    const step = 1000; // 1 second marks
    
    for (let time = 0; time <= MAX_TIME; time += step) {
      const x = timeToPixels(time);
      const isLongMark = time % 5000 === 0; // Every 5 seconds
      
      rulerMarks.push(
        <div key={time} className="absolute flex flex-col items-center">
          <div 
            className="absolute bottom-0"
            style={{
              left: x + TIMELINE_OFFSET_X - scrollLeft,
              width: '1px',
              height: isLongMark ? '8px' : '4px',
              backgroundColor: isLongMark ? '#d4d4d8' : '#a1a1aa'
            }}
          />
          {isLongMark && (
            <div 
              className="absolute bottom-2 text-xs text-zinc-400"
              style={{
                left: x + TIMELINE_OFFSET_X - scrollLeft - 10,
                transform: 'translateX(-50%)'
              }}
            >
              {formatTime(time)}
            </div>
          )}
        </div>
      );
    }
    
    return rulerMarks;
  };

  // Render playhead
  const renderPlayhead = () => {
    const x = timeToPixels(currentTime) + TIMELINE_OFFSET_X - scrollLeft;
    
    return (
      <div
        ref={playheadRef}
        className="absolute top-0 z-20 cursor-pointer"
        style={{
          left: x,
          width: '2px',
          height: TIMELINE_HEIGHT,
          backgroundColor: '#ef4444',
          transform: 'translateX(-1px)'
        }}
        onMouseDown={() => {
          const handleDrag = (e: MouseEvent) => handlePlayheadDrag(e.clientX);
          document.addEventListener('mousemove', handleDrag);
          document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', handleDrag);
          }, { once: true });
        }}
      >
        {/* Playhead indicator */}
        <div 
          className="absolute -top-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
          style={{ transform: 'translateX(-50%)' }}
        />
        <div 
          className="absolute w-0.5 h-full bg-red-500"
          style={{ left: '1px' }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Main
          </Link>
          <h1 className="text-xl font-bold">Learn Timeline</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setCurrentTime(0)}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={addTextElement}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            Add Text
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Player */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
            <Player
              ref={playerRef}
              component={MyComposition}
              inputProps={{ elements, fps: FPS }}
              durationInFrames={Math.floor((MAX_TIME / 1000) * FPS)}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={FPS}
              controls
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="w-1/2 p-4 border-l border-zinc-800">
          {/* Current Time Display */}
          <div className="mb-4 p-2 bg-zinc-800 text-center rounded">
            <span className="text-lg font-mono">{formatTime(currentTime)}</span>
          </div>

          {/* Timeline Container */}
          <div 
            ref={timelineRef}
            className="relative bg-zinc-800 rounded-lg overflow-hidden"
            style={{ height: TIMELINE_HEIGHT }}
          >
            {/* Ruler */}
            <div 
              className="absolute top-0 w-full bg-zinc-700 border-b border-zinc-600 cursor-pointer"
              style={{ height: RULER_HEIGHT }}
              onClick={handleRulerClick}
            >
              {renderRuler()}
            </div>

            {/* Timeline Tracks */}
            <div 
              className="absolute w-full"
              style={{ 
                top: RULER_HEIGHT,
                height: TIMELINE_HEIGHT - RULER_HEIGHT 
              }}
            >
              {/* Track Lines */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-b border-zinc-600"
                  style={{
                    top: i * TRACK_HEIGHT,
                    height: TRACK_HEIGHT
                  }}
                >
                  <div className="absolute left-2 top-2 text-xs text-zinc-400">
                    Track {i + 1}
                  </div>
                </div>
              ))}

              {/* Text Elements */}
              {elements.map((element) => {
                const x = timeToPixels(element.startTime);
                const width = timeToPixels(element.duration);
                const y = element.y * TRACK_HEIGHT;
                
                return (
                  <div
                    key={element.id}
                    className="absolute rounded cursor-move border border-zinc-500 hover:border-zinc-400 transition-colors"
                    style={{
                      left: x + TIMELINE_OFFSET_X - scrollLeft,
                      top: y + 8,
                      width: width,
                      height: TRACK_HEIGHT - 16,
                      backgroundColor: element.color,
                      opacity: draggedElement === element.id ? 0.7 : 1
                    }}
                    onMouseDown={(e) => handleElementDragStart(e, element.id)}
                  >
                    <div className="p-2 text-white text-sm font-medium truncate">
                      {element.text}
                    </div>
                    
                    {/* Resize handles */}
                    <div 
                      className="absolute left-0 top-0 w-2 h-full bg-black/20 cursor-w-resize hover:bg-black/40" 
                      onMouseDown={(e) => handleResizeStart(e, element.id, 'left')}
                    />
                    <div 
                      className="absolute right-0 top-0 w-2 h-full bg-black/20 cursor-e-resize hover:bg-black/40"
                      onMouseDown={(e) => handleResizeStart(e, element.id, 'right')}
                    />
                  </div>
                );
              })}
            </div>

            {/* Playhead */}
            {renderPlayhead()}
          </div>

          {/* Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">Zoom:</label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={scale.zoom}
                  onChange={(e) => setScale(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                  className="w-24"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm">Scroll:</label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, timeToPixels(MAX_TIME) - 400)}
                  value={scrollLeft}
                  onChange={(e) => setScrollLeft(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>

            {/* Timeline Info */}
            <div className="p-4 bg-zinc-800 rounded">
              <h3 className="font-bold mb-2">Enhanced Timeline Features:</h3>
              <ul className="text-sm text-zinc-300 space-y-1">
                <li>• Drag text elements to reposition and change tracks</li>
                <li>• Click on ruler to seek to time (with snapping)</li>
                <li>• Drag playhead to scrub through timeline</li>
                <li>• Elements snap to ruler marks and other elements</li>
                <li>• Resize elements using the left/right handles</li>
                <li>• Elements prevent overlapping on same track</li>
                <li>• Real-time preview in connected player</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn; 