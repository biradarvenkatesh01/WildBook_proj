import { useState } from 'react';
import Logo from '../../components/Logo';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import OwnerSidebar from '../../components/OwnerSidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import Stepper from '../../components/Stepper';
import Table from '../../components/Table';

/**
 * /dev/components — visual check of every shared component in all three themes.
 * Remove or gate this route before production.
 */
export default function DevComponents() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('user');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const themes = ['user', 'admin', 'owner'];
  const statuses = ['CONFIRMED', 'PENDING', 'CANCELLED', 'DRAFT', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'PAST'];

  const tableColumns = [
    { key: 'id',       label: 'Booking ID' },
    { key: 'user',     label: 'User' },
    { key: 'activity', label: 'Activity' },
    { key: 'date',     label: 'Date' },
    { key: 'status',   label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const tableData = [
    { id: 'WB-000101', user: 'Rahul Verma',    activity: 'Jeep Safari',   date: '25 May 2025', status: 'CONFIRMED' },
    { id: 'WB-000102', user: 'Ananya Iyer',     activity: 'Bird Watching', date: '25 May 2025', status: 'PENDING'   },
    { id: 'WB-000103', user: 'Vikram Joshi',    activity: 'Camping',       date: '24 May 2025', status: 'CANCELLED' },
    { id: 'WB-000104', user: 'Meera Nair',      activity: 'Nature Walk',   date: '24 May 2025', status: 'EXPIRED'   },
    { id: 'WB-000105', user: 'Siddharth Rao',   activity: 'Boat Safari',   date: '23 May 2025', status: 'CONFIRMED' },
  ];

  return (
    <div className={`theme-${activeTheme}`} style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Sticky theme switcher */}
      <div className="sticky top-0 z-[100] flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <span className="text-sm font-semibold text-gray-600">Active theme:</span>
        {themes.map(t => (
          <button
            key={t}
            onClick={() => setActiveTheme(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTheme === t
                ? 'bg-[#1F3D2B] text-white shadow'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 font-mono">/dev/components</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        {/* ── Section: Logo ──────────────────────────────────────────────── */}
        <Section title="Logo component — portal prop">
          <div className="flex flex-wrap gap-8 items-center">
            {[['user','md',false], ['user','lg',false], ['admin','md',false], ['admin','sm',false], ['owner','md',false], ['owner','lg',false]].map(([p,s,l],i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: l ? '#1F3D2B' : '#fff', boxShadow: '0 1px 8px rgba(0,0,0,.08)' }}>
                <Logo portal={p} size={s} light={l} />
                <p className="text-xs text-gray-400 mt-2 text-center">portal={p} size={s}</p>
              </div>
            ))}
            {/* Light versions on dark bg */}
            {['user','admin','owner'].map(p => (
              <div key={p} className="p-4 rounded-xl bg-[#1F3D2B]">
                <Logo portal={p} size="md" light />
                <p className="text-xs text-gray-400 mt-2 text-center">light</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Section: Navbar ─────────────────────────────────────────────── */}
        <Section title="Navbar — visitor site">
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <Navbar />
          </div>
          <p className="text-xs text-gray-400 mt-1">Logged-out state (AuthContext has no user in this dev context)</p>
        </Section>

        {/* ── Section: Sidebars ───────────────────────────────────────────── */}
        <Section title="Sidebars">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin sidebar preview (non-fixed for showcase) */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">AdminSidebar</p>
              <div className="relative rounded-xl overflow-hidden" style={{ height: '500px' }}>
                <div className="theme-admin h-full">
                  <div style={{ width: sidebarCollapsed ? '68px' : '220px', backgroundColor: '#1F3D2B', height: '100%', transition: 'width .25s ease', overflow: 'hidden' }}>
                    <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
                      {!sidebarCollapsed && <Logo portal="admin" size="sm" light />}
                      <button onClick={() => setSidebarCollapsed(c => !c)} className="ml-auto p-1.5 text-white opacity-60 hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}/></svg>
                      </button>
                    </div>
                    {['Dashboard','My Sanctuaries','Activities & Slots','Guides & Vehicles','Bookings','Reports'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-all ${i === 0 ? 'bg-amber-400/20 border-l-2 border-amber-400 text-amber-400' : 'text-white opacity-60 hover:opacity-100'}`}>
                        <div className="w-5 h-5 bg-current opacity-60 rounded-sm flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm whitespace-nowrap">{item}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Owner sidebar preview */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">OwnerSidebar</p>
              <div className="relative rounded-xl overflow-hidden" style={{ height: '500px' }}>
                <div className="theme-owner h-full">
                  <div style={{ width: '220px', backgroundColor: '#162B1D', height: '100%' }}>
                    <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
                      <Logo portal="owner" size="sm" light />
                    </div>
                    {['Dashboard','Admin Requests','Sanctuary Requests','Approved Sanctuaries','Reports'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-all ${i === 0 ? 'bg-amber-400/20 border-l-2 border-amber-400 text-amber-400' : 'text-white opacity-60 hover:opacity-100'}`}>
                        <div className="w-5 h-5 bg-current opacity-60 rounded-sm flex-shrink-0" />
                        <span className="text-sm whitespace-nowrap">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section: Buttons ────────────────────────────────────────────── */}
        <Section title="Button — all variants and sizes">
          <div className="space-y-4">
            {['primary','secondary','danger','ghost','approve','reject'].map(variant => (
              <div key={variant} className="flex flex-wrap gap-3 items-center">
                <span className="text-xs font-mono text-gray-400 w-24">{variant}</span>
                {['sm','md','lg'].map(size => (
                  <Button key={size} variant={variant} size={size}>{size.toUpperCase()}</Button>
                ))}
                <Button variant={variant} loading>Loading</Button>
                <Button variant={variant} disabled>Disabled</Button>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Section: Card ───────────────────────────────────────────────── */}
        <Section title="Card — default, hover">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <h3 className="font-semibold mb-1" style={{fontFamily:'var(--font-heading)'}}>Standard Card</h3>
              <p className="text-sm text-gray-500">A card with default padding and shadow.</p>
            </Card>
            <Card hover>
              <h3 className="font-semibold mb-1" style={{fontFamily:'var(--font-heading)'}}>Hover Card</h3>
              <p className="text-sm text-gray-500">Lifts on hover — good for sanctuary cards.</p>
            </Card>
            <Card padding="p-3">
              <h3 className="font-semibold mb-1" style={{fontFamily:'var(--font-heading)'}}>Compact Card</h3>
              <p className="text-sm text-gray-500">Reduced padding variant.</p>
            </Card>
          </div>
        </Section>

        {/* ── Section: StatusBadge ────────────────────────────────────────── */}
        <Section title="StatusBadge — all statuses">
          <div className="flex flex-wrap gap-3">
            {statuses.map(s => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Section>

        {/* ── Section: Stepper ────────────────────────────────────────────── */}
        <Section title="Stepper — various steps">
          <div className="space-y-10">
            {[0,1,2,3].map(current => (
              <div key={current}>
                <p className="text-xs text-gray-400 mb-3">currentStep = {current}</p>
                <Stepper
                  steps={['Submitted','Under Review','Approved','Live']}
                  currentStep={current}
                />
              </div>
            ))}
            <div>
              <p className="text-xs text-gray-400 mb-3">compact variant</p>
              <Stepper
                steps={['Details','Payment','Confirmed']}
                currentStep={1}
                variant="compact"
              />
            </div>
          </div>
        </Section>

        {/* ── Section: Table ──────────────────────────────────────────────── */}
        <Section title="Table — data, loading, empty states">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-400 mb-2">Normal data</p>
              <Table columns={tableColumns} data={tableData} rowKey="id" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Loading skeleton</p>
              <Table columns={tableColumns} data={[]} loading />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Empty state</p>
              <Table columns={tableColumns} data={[]} empty="No bookings found for this period." />
            </div>
          </div>
        </Section>

        {/* ── Section: Modal ──────────────────────────────────────────────── */}
        <Section title="Modal">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Cancel Booking"
            footer={
              <>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Keep Booking</Button>
                <Button variant="danger" onClick={() => setModalOpen(false)}>Confirm Cancellation</Button>
              </>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Are you sure you want to cancel this booking?</p>
              <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Amount paid</span><span className="font-medium">₹4,800</span></div>
                <div className="flex justify-between text-red-600"><span>Cancellation fee (40%)</span><span className="font-medium">−₹1,920</span></div>
                <div className="flex justify-between text-green-600 font-semibold border-t pt-2 mt-1"><span>Refund (60%)</span><span>₹2,880</span></div>
              </div>
            </div>
          </Modal>
        </Section>

        {/* ── Section: Theme palette swatches ─────────────────────────────── */}
        <Section title={`Theme palette — current: ${activeTheme}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Forest green',    'var(--color-forest,#1F3D2B)'],
              ['Moss green',      'var(--color-moss,#5E7F4F)'],
              ['Sage',            'var(--color-sage,#A9BFA0)'],
              ['Cream (page bg)', 'var(--bg-page,#F6F1E7)'],
              ['Bark brown',      'var(--color-bark,#6B4F3A)'],
              ['Amber (accent)',  'var(--color-amber,#D9A441)'],
              ['Nav bg',          'var(--bg-nav,#1F3D2B)'],
              ['Btn primary',     'var(--btn-primary-bg,#D9A441)'],
            ].map(([name, value]) => (
              <div key={name} className="flex flex-col gap-1">
                <div className="h-14 rounded-lg border border-gray-200 shadow-sm" style={{ background: value }} />
                <p className="text-xs font-medium text-gray-600">{name}</p>
                <p className="text-xs font-mono text-gray-400">{value}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>

      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2
        className="text-2xl font-bold mb-6 pb-3 border-b-2 border-[var(--color-amber,#D9A441)]"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary,#1F3D2B)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
