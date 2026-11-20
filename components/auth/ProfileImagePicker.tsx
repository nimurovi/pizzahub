"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { validateProfileImage } from "../../lib/profile-image";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function ProfileImagePicker({
  value,
  onChange,
  disabled = false,
}: Props) {
  const id = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  // Release the temporary image URL when this component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  function updatePreview(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const url = file ? URL.createObjectURL(file) : null;

    previewUrlRef.current = url;
    setPreview(url ?? "");
  }

  function clearSelection() {
    updatePreview(null);
    onChange(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-800"
      >
        Profile image{" "}
        <span className="font-normal text-gray-500">(optional)</span>
      </label>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:flex-row sm:items-center">
        {value && preview ? (
          <Image
            src={preview}
            alt="Selected profile image preview"
            width={80}
            height={80}
            unoptimized
            className="size-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-800">
            Photo
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            aria-describedby={`${id}-help ${id}-error`}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) return;

              const message = validateProfileImage(file);

              if (message) {
                event.target.value = "";
                updatePreview(null);
                onChange(null);
                setError(message);

                toast.error(message, {
                  id: "profile-image-validation",
                });

                return;
              }

              setError("");
              updatePreview(file);
              onChange(file);
            }}
            className="block w-full text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-red-700 disabled:opacity-60"
          />

          <p id={`${id}-help`} className="text-xs text-gray-500">
            JPG, PNG, or WebP. Maximum 2 MB. You can skip this.
          </p>

          {value && (
            <button
              type="button"
              disabled={disabled}
              onClick={clearSelection}
              className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
            >
              Clear selected photo
            </button>
          )}
        </div>
      </div>

      <p
        id={`${id}-error`}
        role="alert"
        className="text-sm text-red-600"
      >
        {error}
      </p>
    </div>
  );
}