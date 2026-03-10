import { mockProfile } from "../mocks/profileMock";
import type { profile, updateProfilePayload } from "../types/profileTypes";

const useMocks = true;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getProfile(): Promise<profile> {
  if (useMocks) {
    await wait(400);
    return mockProfile;
  }

  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  return response.json();
}

export async function updateProfile(
  payload: updateProfilePayload,
): Promise<profile> {
  if (useMocks) {
    await wait(400);
    return {
      ...mockProfile,
      ...payload,
    };
  }

  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
}
