import { Link } from 'react-router';
import { LuArrowLeft, LuCalculator } from 'react-icons/lu';
import { PageHeader } from '@/components/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import { LeadPricingCalculator } from './LeadPricingCalculator';
import { LeadPricingRatesCard } from './LeadPricingRatesCard';

export function LeadPricingView() {
  return (
    <>
      <PageHeader
        title="Lead pricing"
        description="Set what a lead costs and test plan prices before you create them"
        action={
          <Link to="/plans" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <LuArrowLeft className="size-4 me-1 rtl:rotate-180" /> Pricing plans
          </Link>
        }
      />
      <div className="mx-auto max-w-6xl space-y-6">
        <LeadPricingRatesCard />

        <section className="card">
          <div className="card-header">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LuCalculator className="size-4" />
              </span>
              <div>
                <h6 className="card-title">Plan price calculator</h6>
                <p className="mt-1 text-sm text-default-500">
                  Try different lead counts and rates. Nothing here is saved.
                </p>
              </div>
            </div>
          </div>
          <div className="card-body p-6">
            <LeadPricingCalculator />
          </div>
        </section>
      </div>
    </>
  );
}
