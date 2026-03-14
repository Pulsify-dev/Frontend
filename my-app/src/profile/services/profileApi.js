import {
  mapProfileDtoToProfile,
  mapUpdateProfilePayloadToDto,
} from "../adapters/profileAdapter";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyProfileApi() {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const ProfileDto = await response.json();
  return mapProfileDtoToProfile(ProfileDto);
}

export async function getPublicProfileApi(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch public profile");
  }

  const ProfileDto = await response.json();
  return mapProfileDtoToProfile(ProfileDto);
}

export async function updateMyProfileApi(payload) {
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

  const ProfileDto = await response.json();
  return mapProfileDtoToProfile(ProfileDto);
}

export async function uploadAvatarApi(file) {
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

export async function uploadCoverApi(file) {
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
