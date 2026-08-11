import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LuArrowLeft } from 'react-icons/lu';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ErrorState, TenantDetailSkeleton } from '@/components/states';
import { Tabs } from '@/components/ui/tabs';
import { useCanWrite } from '@/features/auth/auth.hooks';
import { WhatsAppNumbersTable } from '@/features/whatsapp-numbers/components/WhatsAppNumbersTable';
import { formatDate, formatFullName } from '@/lib/format';
import { SUBSCRIPTION_STATUS_TONE, TENANT_STATUS_TONE } from '@/lib/statusTones';
import type { TenantStatus } from '@/lib/types';
import { RolePermissionsView } from './RolePermissionsView';
import { useTenant, useTenantWhatsAppNumbers, useUpdateTenantStatus } from '../tenants.hooks';
import { Button } from '@/components/ui/button';

type TenantTab = 'team' | 'roles' | 'billing' | 'whatsapp';

export function TenantDetailView() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const [activeTab, setActiveTab] = useState<TenantTab>('team');

  const { data: tenant, isLoading, isError, error, refetch } = useTenant(id);
  const statusMutation = useUpdateTenantStatus(id);
  const { data: whatsappNumbers, isLoading: isWhatsAppLoading } = useTenantWhatsAppNumbers(id);

  if (isLoading) return <TenantDetailSkeleton />;
  if (isError || !tenant) {
    return (
      <div className="card">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card">
        <div className="card-body">
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2 mb-2"
            onClick={() => navigate('/tenants')}
          >
            <LuArrowLeft className="size-4 me-1 rtl:rotate-180" /> Tenants
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-default-900">{tenant.name}</h1>
                <Badge tone={TENANT_STATUS_TONE[tenant.status]}>{tenant.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-default-500">
                Owner: {tenant.owner?.email ?? '—'} · {tenant._count.leads} leads ·{' '}
                {tenant._count.products} products
              </p>
            </div>
            {canWrite && (
              <Select
                value={tenant.status}
                onChange={event => statusMutation.mutate(event.target.value as TenantStatus)}
                disabled={statusMutation.isPending}
                className="w-40"
                aria-label="Change tenant status"
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CHURNED">Churned</option>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="card">
        <div className="card-body">
          <Tabs
            tabs={[
              { key: 'team', label: 'Team', badge: tenant.memberships.length },
              { key: 'roles', label: 'Roles & Permissions' },
              { key: 'billing', label: 'Subscriptions', badge: tenant.subscriptions.length },
              { key: 'whatsapp', label: 'WhatsApp' },
            ]}
            active={activeTab}
            onChange={tabKey => setActiveTab(tabKey as TenantTab)}
          />

          <div className="pt-4">
            {activeTab === 'team' &&
              (tenant.memberships.length === 0 ? (
                <p className="py-3 text-sm text-default-500">No members.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-default-200">
                    <thead className="bg-default-150">
                      <tr className="text-sm font-normal text-default-700">
                        <th className="px-3.5 py-3 text-start">Member</th>
                        <th className="px-3.5 py-3 text-start">Email</th>
                        <th className="px-3.5 py-3 text-start">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-default-200">
                      {tenant.memberships.map(membership => (
                        <tr key={membership.id} className="text-sm text-default-800">
                          <td className="px-3.5 py-3 font-medium">
                            {formatFullName(membership.user.firstName, membership.user.lastName)}
                          </td>
                          <td className="px-3.5 py-3 text-default-500">{membership.user.email}</td>
                          <td className="px-3.5 py-3">
                            <Badge tone={membership.role.name === 'OWNER' ? 'primary' : 'neutral'}>
                              {membership.role.name}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === 'roles' && <RolePermissionsView tenantId={id} />}

            {activeTab === 'billing' &&
              (tenant.subscriptions.length === 0 ? (
                <p className="py-3 text-sm text-default-500">No subscriptions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-default-200">
                    <thead className="bg-default-150">
                      <tr className="text-sm font-normal text-default-700">
                        <th className="px-3.5 py-3 text-start">Plan</th>
                        <th className="px-3.5 py-3 text-start">Status</th>
                        <th className="px-3.5 py-3 text-start">Period end</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-default-200">
                      {tenant.subscriptions.map(subscription => (
                        <tr key={subscription.id} className="text-sm text-default-800">
                          <td className="px-3.5 py-3">{subscription.plan?.name ?? '—'}</td>
                          <td className="px-3.5 py-3">
                            <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status]}>
                              {subscription.status}
                            </Badge>
                          </td>
                          <td className="px-3.5 py-3 text-default-500">
                            {formatDate(subscription.currentPeriodEnd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === 'whatsapp' && (
              <WhatsAppNumbersTable numbers={whatsappNumbers} isLoading={isWhatsAppLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
