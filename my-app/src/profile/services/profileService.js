import {
  getMyProfileApi,
  getPublicProfileApi,
  updateMyProfileApi,
  uploadAvatarApi,
  uploadCoverApi,
} from "./profileApi";

import {
  getMyProfileMock,
  getPublicProfileMock,
  updateMyProfileMock,
  uploadAvatarMock,
  uploadCoverMock,
} from "./profileMockApi";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const profileService = {
  getMyProfile: USE_MOCKS ? getMyProfileMock : getMyProfileApi,
  getPublicProfile: USE_MOCKS ? getPublicProfileMock : getPublicProfileApi,
  updateMyProfile: USE_MOCKS ? updateMyProfileMock : updateMyProfileApi,
  uploadAvatar: USE_MOCKS ? uploadAvatarMock : uploadAvatarApi,
  uploadCover: USE_MOCKS ? uploadCoverMock : uploadCoverApi,
};
