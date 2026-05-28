import React, { useRef, useState } from 'react'

/**
 * CameraCapture — opens device camera or file picker.
 * Stores the captured image as a base64 string in local state
 * and exposes it via the onCapture callback.
 */
export default function CameraCapture({ onCapture }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const base64 = ev.target.result
      setPreview(base64)
      onCapture?.(base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Capture / Upload Image
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Captured road damage"
            className="w-full rounded-xl object-cover max-h-64"
          />
          <button
            onClick={() => { setPreview(null); onCapture?.(null) }}
            className="absolute top-2 right-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded"
          >
            Retake
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-600 rounded-xl p-8 text-gray-400
                     hover:border-red-500 hover:text-red-400 transition-colors text-center"
        >
          📷 Tap to capture or upload
        </button>
      )}

      {/* Hidden file input — accepts camera on mobile, file picker on desktop */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
