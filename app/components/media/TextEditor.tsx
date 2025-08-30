import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Text Properties</CardTitle>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full h-8 px-2 text-sm bg-muted/50 border border-border rounded-md text-foreground justify-between hover:bg-muted/70"
                      style={{ fontFamily: fontFamily }}
                      aria-label="Select font">
                      <span className="truncate">
                        {availableFonts.find((f) => f.value === fontFamily)?.label || fontFamily}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-md p-1 min-w-[12rem]">
                    {availableFonts.map((font) => (
                      <DropdownMenuItem
                        key={font.label}
                        onSelect={() => setFontFamily(font.value)}
                        className="cursor-pointer"
                        style={{ fontFamily: font.value }}>
                        {font.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Style Controls */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Style</Label>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Alignment</Label>
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
                      title={label}>
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Font Weight & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Weight</Label>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    {(["normal", "bold"] as const).map((weight) => (
                      <Button
                        key={weight}
                        variant={fontWeight === weight ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFontWeight(weight)}
                        className="flex-1 h-8 rounded-none border-0 text-xs"
                        title={weight}>
                        {weight === "normal" ? "Normal" : <Bold className="h-3.5 w-3.5" />}
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
                }}>
                {textContent || "Sample text"}
              </div>
            </div>

            {/* Add Button */}
            <Button onClick={handleAddText} disabled={!textContent.trim()} className="w-full h-9" size="sm">
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Text to Timeline
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
