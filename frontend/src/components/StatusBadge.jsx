/**
 * StatusBadge — coloured pill for booking / sanctuary statuses.
 * Prop  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'EXPIRED' |
 *               'PAST' | 'DRAFT' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
 *
 * Colours from design-spec.md:
 *   Confirmed green, Pending amber, Cancelled red, Past/Draft grey,
 *   Approved green, Rejected red
 */
const STATUS_MAP = {
  CONFIRMED:         { css: 'badge-confirmed', label: 'Confirmed' },
  PENDING:           { css: 'badge-pending',   label: 'Pending'   },
  CANCELLED:         { css: 'badge-cancelled', label: 'Cancelled' },
  EXPIRED:           { css: 'badge-cancelled', label: 'Expired'   },
  PAST:              { css: 'badge-past',      label: 'Past'      },
  DRAFT:             { css: 'badge-draft',     label: 'Draft'     },
  APPROVED:          { css: 'badge-approved',  label: 'Approved'  },
  REJECTED:          { css: 'badge-rejected',  label: 'Rejected'  },
  SUSPENDED:         { css: 'badge-cancelled', label: 'Suspended' },
  PARTIALLY_REFUNDED:{ css: 'badge-pending',   label: 'Refunded'  },
  PAID:              { css: 'badge-confirmed', label: 'Paid'      },
  FAILED:            { css: 'badge-cancelled', label: 'Failed'    },
};

export default function StatusBadge({ status, customLabel }) {
  const key = (status ?? '').toUpperCase();
  const { css, label } = STATUS_MAP[key] ?? { css: 'badge-draft', label: status ?? '—' };
  return (
    <span className={`badge ${css}`}>
      {customLabel ?? label}
    </span>
  );
}
