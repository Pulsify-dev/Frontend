import {
  followUserApi,
  unfollowUserApi,
  getFollowersApi,
  getFollowingApi,
  getSocialCountsApi,
  blockUserApi,
  unblockUserApi,
  updateBlockReasonApi,
  getBlockedUsersApi,
  getRelationshipApi,
  getSuggestedUsersApi,
  getMutualFollowersApi,
} from "./socialApi";

import {
  followUserMock,
  unfollowUserMock,
  getFollowersMock,
  getFollowingMock,
  getSocialCountsMock,
  blockUserMock,
  unblockUserMock,
  updateBlockReasonMock,
  getBlockedUsersMock,
  getRelationshipMock,
  getSuggestedUsersMock,
  getMutualFollowersMock,
} from "./socialMockApi";
console.log(
  "SOCIAL MOCKS CHECK:",
  import.meta.env.VITE_USE_MOCKS,
  typeof import.meta.env.VITE_USE_MOCKS,
);

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const socialService = {
  followUser: USE_MOCKS ? followUserMock : followUserApi,
  unfollowUser: USE_MOCKS ? unfollowUserMock : unfollowUserApi,
  getFollowers: USE_MOCKS ? getFollowersMock : getFollowersApi,
  getFollowing: USE_MOCKS ? getFollowingMock : getFollowingApi,
  getSocialCounts: USE_MOCKS ? getSocialCountsMock : getSocialCountsApi,
  blockUser: USE_MOCKS ? blockUserMock : blockUserApi,
  unblockUser: USE_MOCKS ? unblockUserMock : unblockUserApi,
  updateBlockReason: USE_MOCKS ? updateBlockReasonMock : updateBlockReasonApi,
  getBlockedUsers: USE_MOCKS ? getBlockedUsersMock : getBlockedUsersApi,
  getRelationship: USE_MOCKS ? getRelationshipMock : getRelationshipApi,
  getSuggestedUsers: USE_MOCKS ? getSuggestedUsersMock : getSuggestedUsersApi,
  getMutualFollowers: USE_MOCKS
    ? getMutualFollowersMock
    : getMutualFollowersApi,
};
