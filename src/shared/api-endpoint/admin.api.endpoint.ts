const AdminApiEndpoint = {
  USERS_LIST: '/admin/users',
  USERS_GET_BY_ID: '/admin/users/:id',
  USERS_UPDATE: '/admin/users/:id',
  APPLICATIONS_LIST: '/admin/applications',
  API_KEYS_LIST: '/admin/api-keys',
  SESSIONS_LIST_FOR_USER: '/admin/users/:userId/sessions',
  SESSIONS_REVOKE: '/admin/users/:userId/sessions/:sessionId',
  SYSTEM_SETTINGS: '/admin/system-settings',
};

export const {
  USERS_LIST: ADMIN_USERS_LIST,
  USERS_GET_BY_ID: ADMIN_USERS_GET_BY_ID,
  USERS_UPDATE: ADMIN_USERS_UPDATE,
  APPLICATIONS_LIST: ADMIN_APPLICATIONS_LIST,
  API_KEYS_LIST: ADMIN_API_KEYS_LIST,
  SESSIONS_LIST_FOR_USER: ADMIN_SESSIONS_LIST_FOR_USER,
  SESSIONS_REVOKE: ADMIN_SESSIONS_REVOKE,
  SYSTEM_SETTINGS: ADMIN_SYSTEM_SETTINGS,
} = AdminApiEndpoint;
