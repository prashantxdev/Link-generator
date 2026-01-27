import React from "react";

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const typeStyles = {
    success: "bg-green-900 border-green-700 text-green-200",
    error: "bg-red-900 border-red-700 text-red-200",
    warning: "bg-yellow-900 border-yellow-700 text-yellow-200",
    info: "bg-blue-900 border-blue-700 text-blue-200",
  };

  return (
    <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
      <div className="flex items-center justify-between">
        <p>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
