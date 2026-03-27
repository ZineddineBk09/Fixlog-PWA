"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { optimizeImageForStorage } from "@/lib/image-optimization";
import { useLocale } from "@/providers/locale-provider";

interface CameraInputProps {
  onImageProcessed: (base64String: string) => void;
}

export function CameraInput({ onImageProcessed }: CameraInputProps) {
  const { t, isRTL } = useLocale();
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);

    try {
      const optimizedBase64 = await optimizeImageForStorage(file);
      setPreview(optimizedBase64);
      onImageProcessed(optimizedBase64);
    } catch (error) {
      console.error("Error compressing image:", error);
    } finally {
      setIsCompressing(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onImageProcessed("");
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <input
        type="file"
        id="camera-input"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
        disabled={isCompressing}
      />

      <label
        htmlFor="camera-input"
        className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-semibold text-primary-foreground shadow-sm transition-colors active:scale-[0.99]"
      >
        {isCompressing ? (
          t("compressing")
        ) : (
          <>
            <Camera className="h-5 w-5" />
            {t("snapPhoto")}
          </>
        )}
      </label>

      {preview && (
        <div className="relative h-48 w-full overflow-hidden rounded-3xl border-2 border-border bg-white shadow-sm dark:bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={t("photo")}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className={`absolute top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white active:bg-red-700 ${
              isRTL ? "left-2" : "right-2"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
