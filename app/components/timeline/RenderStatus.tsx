import React from "react";

interface RenderStatusProps {
  renderStatus: string;
  renderProgress?: number;
}

export const RenderStatus: React.FC<RenderStatusProps> = ({ renderStatus, renderProgress }) => {
  if (!renderStatus) return null;

  const isError = renderStatus.startsWith("Error");
  const isSuccess = renderStatus.includes("complete") || renderStatus.includes("successfully");
  const showProgress = !isError && !isSuccess && renderProgress !== undefined && renderProgress > 0;

  return (
    <div
      className={`p-3 rounded flex-shrink-0 text-sm min-w-48 ${
        isError
          ? "bg-red-900/50 text-red-300 border border-red-700"
          : isSuccess
            ? "bg-green-900/50 text-green-300 border border-green-700"
            : "bg-blue-900/50 text-blue-300 border border-blue-700"
      }`}>
      {renderStatus}
      {showProgress && (
        <div className="mt-2 h-1.5 rounded-full bg-blue-900">
          <div
            className="h-full rounded-full bg-blue-400 transition-all duration-300"
            style={{ width: `${renderProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
