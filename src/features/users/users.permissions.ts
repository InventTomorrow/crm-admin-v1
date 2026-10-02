import { SystemPermissions } from '@/lib/permissions';

/** Any one of these makes the user actions menu worth showing. */
export const USER_ACTION_PERMISSIONS = [
  SystemPermissions.USERS_EDIT,
  SystemPermissions.USERS_VERIFY,
  SystemPermissions.USERS_SUSPEND,
  SystemPermissions.USERS_RESET_PASSWORD,
  SystemPermissions.USERS_REVOKE_SESSIONS,
  SystemPermissions.USERS_ROLE_CHANGE,
  SystemPermissions.USERS_DELETE,
  SystemPermissions.USERS_RESTORE,
  SystemPermissions.USERS_WIPE_WORKSPACES,
];
