/**
 * Stepper — horizontal progress indicator.
 * Props:
 *  - steps:        string[]  e.g. ['Submitted', 'Under Review', 'Approved']
 *  - currentStep:  number    0-based index of the current step
 *  - variant:      'default' | 'compact'
 */
export default function Stepper({ steps = [], currentStep = 0, variant = 'default' }) {
  return (
    <div className="flex items-center w-full" role="list" aria-label="Progress steps">
      {steps.map((label, i) => {
        const done    = i < currentStep;
        const active  = i === currentStep;
        const future  = i > currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none" role="listitem">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'flex items-center justify-center rounded-full font-semibold transition-all duration-300',
                  variant === 'compact' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm',
                  done   ? 'bg-[var(--color-moss,#5E7F4F)] text-white'   : '',
                  active ? 'bg-[var(--btn-primary-bg,#D9A441)] text-[var(--btn-primary-text,#1F3D2B)] shadow-md ring-4 ring-[var(--btn-primary-bg,#D9A441)]/25' : '',
                  future ? 'bg-gray-100 text-gray-400 border-2 border-gray-200'    : '',
                ].join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Label */}
              {variant !== 'compact' && (
                <span
                  className={[
                    'mt-2 text-xs text-center max-w-[80px]',
                    active ? 'text-[var(--color-bark,#6B4F3A)] font-semibold' : '',
                    done   ? 'text-[var(--color-moss,#5E7F4F)] font-medium'  : '',
                    future ? 'text-gray-400'                                   : '',
                  ].join(' ')}
                >
                  {label}
                </span>
              )}
            </div>

            {/* Connector line (not after last) */}
            {i < steps.length - 1 && (
              <div
                className={[
                  'flex-1 h-0.5 mx-2 rounded transition-all duration-300',
                  i < currentStep ? 'bg-[var(--color-moss,#5E7F4F)]' : 'bg-gray-200',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
