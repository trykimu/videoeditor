export default function TextEditor() {
  return (
    <div className="w-1/3 bg-gray-50 p-3 rounded-lg shadow border border-gray-200 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2">Text Editor</h3>
      <div className="space-y-2">
        <textarea
          value={"Hello World"}
          className="w-full h-40 p-2 border border-gray-300 rounded"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Add Text</button>
      </div>
    </div>
  )
}
