import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Type,
  X,
  Check,
} from "lucide-react";
import type { TextProperties } from "./types";

interface TextPropertiesEditorProps {
  textProperties: TextProperties;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProperties: TextProperties) => void;
  scrubberId: string;
}

export const TextPropertiesEditor: React.FC<TextPropertiesEditorProps> = ({
  textProperties,
  isOpen,
  onClose,
  onSave,
  scrubberId,
}) => {
  const [textContent, setTextContent] = useState(textProperties.textContent);
  const [fontSize, setFontSize] = useState(textProperties.fontSize);
  const [fontFamily, setFontFamily] = useState(textProperties.fontFamily);
  const [color, setColor] = useState(textProperties.color);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    textProperties.textAlign
  );
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">(
    textProperties.fontWeight
  );

  // Reset form when properties change
  useEffect(() => {
    setTextContent(textProperties.textContent);
    setFontSize(textProperties.fontSize);
    setFontFamily(textProperties.fontFamily);
    setColor(textProperties.color);
    setTextAlign(textProperties.textAlign);
    setFontWeight(textProperties.fontWeight);
  }, [textProperties]);

  const handleSave = () => {
    const updatedProperties: TextProperties = {
      textContent,
      fontSize,
      fontFamily,
      color,
      textAlign,
      fontWeight,
    };
    onSave(updatedProperties);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setTextContent(textProperties.textContent);
    setFontSize(textProperties.fontSize);
    setFontFamily(textProperties.fontFamily);
    setColor(textProperties.color);
    setTextAlign(textProperties.textAlign);
    setFontWeight(textProperties.fontWeight);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-background border border-border rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Edit Text Properties</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Content */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Content</Label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full h-20 p-3 text-sm bg-muted/50 border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                placeholder="Enter your text..."
              />
            </div>

            {/* Font Size & Family Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Size</Label>
                <Input
                  type="number"
                  min="8"
                  max="200"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Font</Label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-8 px-2 text-sm bg-muted/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="Arial">Arial</option>
                  <option value="Arial Narrow">Arial Narrow</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Style Controls */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Style</Label>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Alignment
                </Label>
                <div className="flex rounded-md border border-border overflow-hidden">
                  {(
                    [
                      { value: "left", icon: AlignLeft, label: "Left" },
                      { value: "center", icon: AlignCenter, label: "Center" },
                      { value: "right", icon: AlignRight, label: "Right" },
                    ] as const
                  ).map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={textAlign === value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTextAlign(value)}
                      className="flex-1 h-8 rounded-none border-0"
                      title={label}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Font Weight & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Weight
                  </Label>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    {(["normal", "bold"] as const).map((weight) => (
                      <Button
                        key={weight}
                        variant={fontWeight === weight ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFontWeight(weight)}
                        className="flex-1 h-8 rounded-none border-0 text-xs"
                        title={weight}
                      >
                        {weight === "normal" ? (
                          "Normal"
                        ) : (
                          <Bold className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-8 bg-muted/50 border border-border rounded-md cursor-pointer"
                    />
                    <Badge variant="outline" className="text-xs font-mono">
                      {color.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Preview</Label>
              <div
                className="w-full h-20 bg-muted/30 border border-border rounded-md flex items-center justify-center p-3"
                style={{
                  textAlign: textAlign,
                  fontSize: `${Math.min(fontSize * 0.3, 18)}px`,
                  fontFamily: fontFamily,
                  fontWeight: fontWeight,
                  color: color,
                }}
              >
                {textContent || "Sample text"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 h-9"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!textContent.trim()}
                className="flex-1 h-9"
                size="sm"
              >
                <Check className="h-3.5 w-3.5 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
