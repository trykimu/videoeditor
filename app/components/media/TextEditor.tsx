import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { AlignLeft, AlignCenter, AlignRight, Bold, ChevronDown, Type, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";

interface TextEditorProps {
  onAddText: (
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold",
  ) => void;
}

export default function TextEditor() {
  const { onAddText } = useOutletContext<TextEditorProps>();
  const navigate = useNavigate();

  const [textContent, setTextContent] = useState("Hello World");
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [color, setColor] = useState("#ffffff");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");

  const availableFonts = [
    { label: "Arial", value: "Arial, Helvetica, sans-serif" },
    { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
    { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
    { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
    { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
    { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  ];

  const handleAddText = () => {
    if (textContent.trim()) {
      onAddText(textContent, fontSize, fontFamily, color, textAlign, fontWeight);
      navigate("../media-bin");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <Type className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Text Properties</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        {/* Text Content */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Content</div>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-20 p-2 text-xs bg-muted/30 border border-border/50 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
            placeholder="Enter your text..."
          />
        </div>

        <Separator />

        {/* Font Size & Family Row */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Typography</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Size</Label>
              <Input
                type="number"
                min="8"
                max="200"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
                className="h-6 text-xs px-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Font</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-6 px-2 text-xs bg-muted/30 border border-border/50 rounded text-foreground justify-between hover:bg-muted/50"
                    style={{ fontFamily: fontFamily }}
                    aria-label="Select font">
                    <span className="truncate text-[10px]">
                      {availableFonts.find((f) => f.value === fontFamily)?.label || fontFamily}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1 opacity-60 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-md p-1 min-w-[10rem]">
                  {availableFonts.map((font) => (
                    <DropdownMenuItem
                      key={font.label}
                      onSelect={() => setFontFamily(font.value)}
                      className="cursor-pointer text-xs"
                      style={{ fontFamily: font.value }}>
                      {font.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <Separator />

        {/* Style Controls */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Style</div>

          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Alignment</div>
            <div className="flex rounded border border-border/50 overflow-hidden">
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
                  className="flex-1 h-7 rounded-none border-0"
                  title={label}>
                  <Icon className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">Weight</div>
              <div className="flex rounded border border-border/50 overflow-hidden">
                {(["normal", "bold"] as const).map((weight) => (
                  <Button
                    key={weight}
                    variant={fontWeight === weight ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFontWeight(weight)}
                    className="flex-1 h-7 rounded-none border-0 text-[10px]"
                    title={weight}>
                    {weight === "normal" ? "Normal" : <Bold className="h-3 w-3" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">Color</div>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 h-7 bg-muted/30 border border-border/50 rounded cursor-pointer"
                />
                <Badge variant="outline" className="text-[9px] font-mono px-1 shrink-0">
                  {color.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Preview</div>
          <div
            className="w-full h-16 bg-muted/30 border border-border/50 rounded flex items-center justify-center p-2 overflow-hidden"
            style={{
              textAlign: textAlign,
              fontSize: `${Math.min(fontSize * 0.3, 16)}px`,
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              color: color,
            }}>
            {textContent || "Sample text"}
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="px-3 py-3 border-t border-border/50 shrink-0">
        <Button onClick={handleAddText} disabled={!textContent.trim()} className="w-full h-8 text-xs" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Text to Timeline
        </Button>
      </div>
    </div>
  );
}
