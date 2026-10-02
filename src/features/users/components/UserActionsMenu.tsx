import { ConfirmDialog, type ConfirmIntent } from '@/components/ui/confirm-dialog';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import type { SystemRole, UserListItem } from '@/lib/types';
import { Fragment, useState, type ReactNode } from 'react';
import type { IconType } from 'react-icons/lib';
import {
  LuChevronDown,
  LuEllipsis,
  LuKeyRound,
  LuLogOut,
  LuMail,
  LuMailCheck,
  LuMailX,
  LuRotateCcw,
  LuShieldCheck,
  LuShieldOff,
  LuUserCheck,
  LuUserX,
} from 'react-icons/lu';
import {
  useDeleteUser,
  useResendVerificationEmail,
  useRestoreUser,
  useRevokeUserSessions,
  useSendPasswordReset,
  useSetEmailVerification,
  useSetSuspension,
  useSetSystemRole,
  useWipeUserWorkspaces,
} from '../users.hooks';
import { EditUserDialog } from './EditUserDialog';

export type ActionableUser = Pick<
  UserListItem,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'emailVerifiedAt'
  | 'suspendedAt'
  | 'deletedAt'
  | 'permanentlyDeletedAt'
  | 'workspaceDataWipedAt'
  | 'systemMembership'
  | '_count'
>;

type PendingUserAction =
  | { kind: 'edit' }
  | { kind: 'role'; role: SystemRole | null }
  | { kind: 'verification'; verified: boolean }
  | { kind: 'resendVerification' }
  | { kind: 'suspension'; suspended: boolean }
  | { kind: 'passwordReset' }
  | { kind: 'revokeSessions' }
  | { kind: 'delete' }
  | { kind: 'restore' }
  | { kind: 'wipe' };

type ConfirmableUserAction = Exclude<PendingUserAction, { kind: 'edit' }>;

interface ConfirmationCopy {
  title: string;
  description: string;
  confirmLabel: string;
  intent: ConfirmIntent;
  icon?: IconType;
}

const ROLE_LABEL: Record<SystemRole, string> = {
  SYSTEM_ADMIN: 'System Admin',
  SYSTEM_MANAGER: 'System Manager',
};

/** Workspace fallout leads, since the admin cannot see it from the row they clicked. */
function getDeletionWarning(user: ActionableUser): string {
  const ownedCount = user._count?.ownedTenants ?? 0;
  const workspaceFallout =
    ownedCount > 0
      ? `The ${ownedCount} workspace${ownedCount === 1 ? '' : 's'} this user owns ${
          ownedCount === 1 ? 'is' : 'are'
        } suspended along with the account — every member loses access and any connected WhatsApp number is dropped. `
      : '';
  return `${workspaceFallout}Nothing is erased: the account and its workspaces stay restorable until the purge date, after which the closure is permanent.`;
}

function getConfirmationCopy(
  action: ConfirmableUserAction,
  user: ActionableUser
): ConfirmationCopy {
  switch (action.kind) {
    case 'role':
      if (!action.role) {
        return {
          title: `Revoke ${user.email}'s system role?`,
          description: 'They immediately lose all access to the admin portal.',
          confirmLabel: 'Revoke system role',
          intent: 'warning',
          icon: LuShieldOff,
        };
      }
      return {
        title: `Make ${user.email} a ${ROLE_LABEL[action.role]}?`,
        description:
          action.role === 'SYSTEM_ADMIN'
            ? 'System Admins have full access to the admin portal, including billing and every user account.'
            : 'System Managers can manage subscriptions and workspaces, but not user accounts or platform settings.',
        confirmLabel: `Grant ${ROLE_LABEL[action.role]}`,
        intent: 'info',
        icon: LuShieldCheck,
      };
    case 'verification':
      return action.verified
        ? {
            title: `Mark ${user.email} as verified?`,
            description:
              'Skips the email link — they can sign in and continue setup straight away.',
            confirmLabel: 'Mark verified',
            intent: 'success',
            icon: LuMailCheck,
          }
        : {
            title: `Mark ${user.email} as unverified?`,
            description:
              'They are sent back to the verification screen and must confirm their email again before using the CRM.',
            confirmLabel: 'Mark unverified',
            intent: 'warning',
            icon: LuMailX,
          };
    case 'resendVerification':
      return {
        title: `Resend the verification email to ${user.email}?`,
        description: 'A new link is sent and any earlier link stops working.',
        confirmLabel: 'Send email',
        intent: 'info',
        icon: LuMail,
      };
    case 'suspension':
      return action.suspended
        ? {
            title: `Suspend ${user.email}?`,
            description:
              'They are signed out everywhere and blocked from signing in until reactivated. Open tabs lose access within about 15 minutes. Their workspaces keep running for other members.',
            confirmLabel: 'Suspend account',
            intent: 'warning',
            icon: LuUserX,
          }
        : {
            title: `Reactivate ${user.email}?`,
            description: 'They can sign in again. Their workspaces and data are unchanged.',
            confirmLabel: 'Reactivate account',
            intent: 'success',
            icon: LuUserCheck,
          };
    case 'passwordReset':
      return {
        title: `Send a password reset to ${user.email}?`,
        description:
          'Emails a reset link valid for 30 minutes. Their current password keeps working until they set a new one.',
        confirmLabel: 'Send reset link',
        intent: 'info',
        icon: LuKeyRound,
      };
    case 'revokeSessions':
      return {
        title: `Sign ${user.email} out everywhere?`,
        description:
          'Ends every signed-in session on all devices. Open tabs lose access within about 15 minutes. They can sign in again straight away.',
        confirmLabel: 'Sign out everywhere',
        intent: 'warning',
        icon: LuLogOut,
      };
    case 'delete':
      return {
        title: `Delete ${user.email}?`,
        description: getDeletionWarning(user),
        confirmLabel: 'Delete user',
        intent: 'danger',
      };
    case 'restore':
      return {
        title: `Restore ${user.email}?`,
        description: 'Reactivates the account and every workspace its deletion closed.',
        confirmLabel: 'Restore account',
        intent: 'success',
        icon: LuRotateCcw,
      };
    case 'wipe':
      return {
        title: `Erase workspaces owned by ${user.email}?`,
        description:
          'Permanently deletes every workspace this account owns and all of their data — leads, conversations, orders, products and settings. The user record itself is kept. This cannot be undone.',
        confirmLabel: 'Erase workspaces',
        intent: 'danger',
      };
  }
}

function MenuDivider() {
  return <div className="-mx-2 my-1 border-t border-default-200" />;
}

interface UserActionsMenuProps {
  user: ActionableUser;
  /** `icon` for table rows, `button` for the detail sheet. */
  appearance?: 'icon' | 'button';
}

export function UserActionsMenu({ user, appearance = 'icon' }: UserActionsMenuProps) {
  const { can } = usePermissions();
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null);
  // Separate from the action so the dialog keeps its copy through the exit animation.
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openAction = (action: PendingUserAction) => {
    setPendingAction(action);
    setIsDialogOpen(true);
  };

  const menuGroups = user.deletedAt
    ? getDeletedAccountGroups(user, can, openAction)
    : getLiveAccountGroups(user, can, openAction);

  return (
    // Dialogs portal out of the table row, but React still bubbles their clicks to it.
    <span className="inline-flex" onClick={event => event.stopPropagation()}>
      <Dropdown
        trigger={
          appearance === 'button' ? (
            <>
              Actions
              <LuChevronDown className="size-4" />
            </>
          ) : (
            <LuEllipsis className="size-4" />
          )
        }
        triggerLabel="User actions"
        triggerClassName={appearance === 'button' ? 'w-auto gap-1.5 px-3 text-sm' : undefined}
      >
        {menuGroups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 && <MenuDivider />}
            {group.content}
          </Fragment>
        ))}
      </Dropdown>

      {pendingAction && (
        <UserActionDialog
          user={user}
          action={pendingAction}
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </span>
  );
}

interface MenuGroup {
  key: string;
  content: ReactNode;
}

type PermissionCheck = ReturnType<typeof usePermissions>['can'];

// A deleted account offers the rescue path until it closes for good; after that
// the only remaining action is erasing the workspaces it left behind.
function getDeletedAccountGroups(
  user: ActionableUser,
  can: PermissionCheck,
  openAction: (action: PendingUserAction) => void
): MenuGroup[] {
  if (!user.permanentlyDeletedAt) {
    return can(SystemPermissions.USERS_RESTORE)
      ? [
          {
            key: 'restore',
            content: (
              <DropdownItem onSelect={() => openAction({ kind: 'restore' })}>
                Restore account
              </DropdownItem>
            ),
          },
        ]
      : [];
  }
  if (user.workspaceDataWipedAt) {
    return [{ key: 'closed', content: <DropdownLabel>Closed — workspaces erased</DropdownLabel> }];
  }
  return can(SystemPermissions.USERS_WIPE_WORKSPACES)
    ? [
        {
          key: 'wipe',
          content: (
            <>
              <DropdownLabel>Closed — cannot be restored</DropdownLabel>
              <DropdownItem destructive onSelect={() => openAction({ kind: 'wipe' })}>
                Erase workspaces
              </DropdownItem>
            </>
          ),
        },
      ]
    : [];
}

function getLiveAccountGroups(
  user: ActionableUser,
  can: PermissionCheck,
  openAction: (action: PendingUserAction) => void
): MenuGroup[] {
  const groups: MenuGroup[] = [];
  const isSuspended = !!user.suspendedAt;

  if (can(SystemPermissions.USERS_EDIT)) {
    groups.push({
      key: 'edit',
      content: (
        <DropdownItem onSelect={() => openAction({ kind: 'edit' })}>Edit details</DropdownItem>
      ),
    });
  }

  if (can(SystemPermissions.USERS_VERIFY)) {
    groups.push({
      key: 'verification',
      content: (
        <>
          <DropdownLabel>Email verification</DropdownLabel>
          {user.emailVerifiedAt ? (
            <DropdownItem onSelect={() => openAction({ kind: 'verification', verified: false })}>
              Mark as unverified
            </DropdownItem>
          ) : (
            <>
              <DropdownItem onSelect={() => openAction({ kind: 'verification', verified: true })}>
                Mark as verified
              </DropdownItem>
              <DropdownItem onSelect={() => openAction({ kind: 'resendVerification' })}>
                Resend verification email
              </DropdownItem>
            </>
          )}
        </>
      ),
    });
  }

  // A suspended account has no sessions left and cannot use a reset link.
  const canResetPassword = can(SystemPermissions.USERS_RESET_PASSWORD) && !isSuspended;
  const canRevokeSessions = can(SystemPermissions.USERS_REVOKE_SESSIONS) && !isSuspended;
  if (canResetPassword || canRevokeSessions) {
    groups.push({
      key: 'access',
      content: (
        <>
          <DropdownLabel>Access</DropdownLabel>
          {canResetPassword && (
            <DropdownItem onSelect={() => openAction({ kind: 'passwordReset' })}>
              Send password reset
            </DropdownItem>
          )}
          {canRevokeSessions && (
            <DropdownItem onSelect={() => openAction({ kind: 'revokeSessions' })}>
              Sign out everywhere
            </DropdownItem>
          )}
        </>
      ),
    });
  }

  if (can(SystemPermissions.USERS_ROLE_CHANGE)) {
    groups.push({
      key: 'role',
      content: (
        <>
          <DropdownLabel>System role</DropdownLabel>
          <DropdownItem onSelect={() => openAction({ kind: 'role', role: 'SYSTEM_ADMIN' })}>
            Make System Admin
          </DropdownItem>
          <DropdownItem onSelect={() => openAction({ kind: 'role', role: 'SYSTEM_MANAGER' })}>
            Make System Manager
          </DropdownItem>
          {user.systemMembership && (
            <DropdownItem onSelect={() => openAction({ kind: 'role', role: null })}>
              Revoke system role
            </DropdownItem>
          )}
        </>
      ),
    });
  }

  const canSuspend = can(SystemPermissions.USERS_SUSPEND);
  const canDelete = can(SystemPermissions.USERS_DELETE);
  if (canSuspend || canDelete) {
    groups.push({
      key: 'danger',
      content: (
        <>
          {canSuspend &&
            (isSuspended ? (
              <DropdownItem onSelect={() => openAction({ kind: 'suspension', suspended: false })}>
                Reactivate account
              </DropdownItem>
            ) : (
              <DropdownItem
                destructive
                onSelect={() => openAction({ kind: 'suspension', suspended: true })}
              >
                Suspend account
              </DropdownItem>
            ))}
          {canDelete && (
            <DropdownItem destructive onSelect={() => openAction({ kind: 'delete' })}>
              Delete user
            </DropdownItem>
          )}
        </>
      ),
    });
  }

  return groups;
}

interface UserActionDialogProps {
  user: ActionableUser;
  action: PendingUserAction;
  open: boolean;
  onClose: () => void;
}

/** Mounted only once an action is picked, so table rows don't each carry every mutation. */
function UserActionDialog({ user, action, open, onClose }: UserActionDialogProps) {
  const roleMutation = useSetSystemRole();
  const verificationMutation = useSetEmailVerification();
  const resendVerificationMutation = useResendVerificationEmail();
  const suspensionMutation = useSetSuspension();
  const passwordResetMutation = useSendPasswordReset();
  const revokeSessionsMutation = useRevokeUserSessions();
  const deleteMutation = useDeleteUser();
  const restoreMutation = useRestoreUser();
  const wipeMutation = useWipeUserWorkspaces();

  if (action.kind === 'edit') {
    return <EditUserDialog open={open} onOpenChange={isOpen => !isOpen && onClose()} user={user} />;
  }

  const runConfirmedAction = () => {
    switch (action.kind) {
      case 'role':
        return roleMutation.mutate({ id: user.id, role: action.role });
      case 'verification':
        return verificationMutation.mutate({ id: user.id, verified: action.verified });
      case 'resendVerification':
        return resendVerificationMutation.mutate(user.id);
      case 'suspension':
        return suspensionMutation.mutate({ id: user.id, suspended: action.suspended });
      case 'passwordReset':
        return passwordResetMutation.mutate(user.id);
      case 'revokeSessions':
        return revokeSessionsMutation.mutate(user.id);
      case 'delete':
        return deleteMutation.mutate(user.id);
      case 'restore':
        return restoreMutation.mutate(user.id);
      case 'wipe':
        return wipeMutation.mutate(user.id);
    }
  };

  const copy = getConfirmationCopy(action, user);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      intent={copy.intent}
      icon={copy.icon}
      onConfirm={() => {
        runConfirmedAction();
        onClose();
      }}
    />
  );
}
