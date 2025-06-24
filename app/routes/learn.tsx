export default function Learn() {
  return (
    <div className="h-screen flex flex-col p-2 gap-2">
      {/* =============== Header =============== */}
      <div className="border border-black flex rounded-md justify-between items-center p-2">
        <h1>EasyEdits</h1>
        <button className="border border-black p-1">
          Export
        </button>
      </div>

      {/* =============== Main Content =============== */}
      <div className="border border-black rounded-md flex flex-row gap-2">

        {/* Side Panel */}
        <div className="border border-black rounded-md flex flex-col gap-4 w-fit">
          <div className="border border-black p-2 rounded-md bg-gray-200">
            <p>Media Item</p>
          </div>
          <div className="border border-black p-2 rounded-md bg-gray-200">
            <p>Text Item</p>
          </div>
        </div>

        {/* Item Viewer / Editor */}
        <div className="border border-black rounded-md flex flex-col gap-4 w-[640px] h-[360px]">
          <p>THIS IS ITEM VIEWER</p>
        </div>

        {/* Player */}
        <div className="border border-black rounded-md flex flex-col gap-4 flex-1">
          <p>THIS IS PLAYER</p>
        </div>
      </div>

      {/* =============== Controls =============== */}
      <div className="border border-black rounded-md flex flex-row justify-between items-center">
        <div>
          <button className="border border-black p-1 m-1">
            +
          </button>
          <button className="border border-black p-1 m-1">
            Aspect Ratio Chooser
          </button>
        </div>
        <button className="border border-black p-1 m-1">
          Stats
        </button>
      </div>

      {/* =============== Timeline =============== */}
      <div className="border border-black rounded-md flex flex-col w-full flex-1 min-h-0">
        <p>THIS IS TIMELINE</p>
      </div>
    </div>
  )
}