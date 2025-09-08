"use client";
import { useCallback, useState } from "react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...list]);
  }, []);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(prev => [...prev, ...list]);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Upload</h1>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed bg-white p-8 text-center text-sm"
      >
        Drag & drop contracts here (PDF/DOCX), or
        <label className="ml-1 underline cursor-pointer">
          browse
          <input type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={onInput} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-2">Upload queue</div>
          <ul className="text-sm space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex justify-between">
                <span className="truncate max-w-[70%]">{f.name}</span>
                <span className="text-xs text-gray-500">{Math.round(f.size/1024)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
