import React, { useState } from "react"
import { useOutletContext, useNavigate } from "react-router"

interface TextEditorProps {
  onAddText: (textContent: string, fontSize: number, fontFamily: string, color: string, textAlign: "left" | "center" | "right", fontWeight: "normal" | "bold") => void
}

export default function TextEditor() {
  const { onAddText } = useOutletContext<TextEditorProps>()
  const navigate = useNavigate()
  
  const [textContent, setTextContent] = useState("Hello World")
  const [fontSize, setFontSize] = useState(48)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [color, setColor] = useState("#ffffff")
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center")
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal")

  const handleAddText = () => {
    if (textContent.trim()) {
      onAddText(textContent, fontSize, fontFamily, color, textAlign, fontWeight)
      navigate("/media-bin")
    }
  }

  return (
    <div className="w-full bg-gray-700 p-3 h-full overflow-y-auto">
      <h3 className="text-sm font-medium mb-3 text-gray-200">Text Editor</h3>
      
      <div className="space-y-3">
        {/* Text Content */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Text</label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-16 p-2 text-sm bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="Enter your text..."
          />
        </div>

        {/* Font Controls Row */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-300 mb-1">Size</label>
            <input
              type="number"
              min="8"
              max="200"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
              className="w-full p-1 text-sm bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div className="flex-2">
            <label className="block text-xs font-medium text-gray-300 mb-1">Font</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full p-1 text-sm bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Impact">Impact</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 bg-gray-600 border border-gray-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Style Controls Row */}
        <div className="flex items-center gap-3">
          {/* Text Alignment */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Align</label>
            <div className="flex">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => setTextAlign(align)}
                  className={`px-2 py-1 text-xs font-medium transition-colors first:rounded-l last:rounded-r ${
                    textAlign === align
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 border border-gray-500'
                  }`}
                  title={`Align ${align}`}
                >
                  {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                </button>
              ))}
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Weight</label>
            <div className="flex">
              {(['normal', 'bold'] as const).map((weight) => (
                <button
                  key={weight}
                  onClick={() => setFontWeight(weight)}
                  className={`px-2 py-1 text-xs font-medium transition-colors first:rounded-l last:rounded-r ${
                    fontWeight === weight
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 border border-gray-500'
                  }`}
                  title={weight}
                >
                  {weight === 'normal' ? 'N' : 'B'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Text Button */}
        <button
          onClick={handleAddText}
          disabled={!textContent.trim()}
          className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
            textContent.trim()
              ? 'bg-cyan-500 text-white hover:bg-cyan-600'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Add Text to Timeline
        </button>
      </div>
    </div>
  )
}
