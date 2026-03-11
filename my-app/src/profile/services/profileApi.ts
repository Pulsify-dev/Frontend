import {
  mapProfileDtoToProfile,
  mapUpdateProfilePayloadToDto,
} from "../adapters/profileAdapter";
import type {
  Profile,
  ProfileDto,
  UpdateProfilePayload,
} from "../types/profileTypes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyProfileApi(): Promise<Profile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const data: ProfileDto = await response.json();
  return mapProfileDtoToProfile(data);
}

export async function getPublicProfileApi(userId: string): Promise<Profile> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch public profile");
  }

  const data: ProfileDto = await response.json();
  return mapProfileDtoToProfile(data);
}

export async function updateMyProfileApi(
  payload: UpdateProfilePayload,
): Promise<Profile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(mapUpdateProfilePayloadToDto(payload)),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  const data: ProfileDto = await response.json();
  return mapProfileDtoToProfile(data);
}

export async function uploadAvatarApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload avatar");
  }

  const data = await response.json();
  return data.url;
}

export async function uploadCoverApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/users/me/cover`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload cover");
  }

  const data = await response.json();
  return data.url;
}
