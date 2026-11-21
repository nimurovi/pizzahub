import { apiFetch } from "@/lib/api-fetch";

export function validateProfileImage(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Please select a JPG, PNG, or WebP image.";
  }

  if (file.size === 0) {
    return "This file is empty. Please select another image.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "Your profile image must be 2 MB or smaller.";
  }

  return null;
}

export async function uploadProfileImage(file: File): Promise<string> {
  const validationError = validateProfileImage(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const body = new FormData();
  body.append("image", file);

  let response: Response;

  try {
    response = await apiFetch(`${apiUrl}/api/profile/image`, {
      method: "POST",
      credentials: "include",
      body,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(
        "The upload timed out. Check Profile Settings before trying again."
      );
    }

    throw new Error("Could not reach the server. Check your connection.");
  }

  const result = await response.json().catch(() => null);

  if (
    !response.ok ||
    result?.success !== true ||
    typeof result?.data?.image !== "string"
  ) {
    throw new Error(
      result?.message || "Could not upload your profile image."
    );
  }

  return result.data.image;
}