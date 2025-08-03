import React, { useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { type ScrubberState } from "./types";

interface VolumeControlProps {
  scrubber: ScrubberState;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedScrubber: ScrubberState) => void;
  scrubberId: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  scrubber,
  isOpen,
  onClose,
  onSave,
  scrubberId,
}) => {
  const [volume, setVolume] = useState(scrubber.volume || 1);
  const [muted, setMuted] = useState(scrubber.muted || false);

  const handleSave = useCallback(() => {
    const updatedScrubber: ScrubberState = {
      ...scrubber,
      volume,
      muted,
    };
    onSave(updatedScrubber);
    onClose();
  }, [scrubber, volume, muted, onSave, onClose]);

  const handleCancel = useCallback(() => {
    // Reset to original values
    setVolume(scrubber.volume || 1);
    setMuted(scrubber.muted || false);
    onClose();
  }, [scrubber.volume, scrubber.muted, onClose]);

  const handleMuteToggle = useCallback(() => {
    setMuted(!muted);
  }, [muted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    // Automatically unmute when volume is changed
    if (newVolume > 0 && muted) {
      setMuted(false);
    }
  }, [muted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Volume Control</h3>
          <button
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Mute Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Mute</label>
            <button
              onClick={handleMuteToggle}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                muted
                  ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {muted ? "Muted" : "Unmuted"}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-sm text-muted-foreground">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              disabled={muted}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-muted/30 rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-2">Preview:</div>
            <div className="flex items-center gap-2">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="text-sm">
                {muted ? "Muted" : `Volume: ${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
