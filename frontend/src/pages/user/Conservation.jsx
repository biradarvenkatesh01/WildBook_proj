import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ElephantIcon, TreeIcon, UserIcon, BarChartIcon } from '../../components/Icons';

export default function Conservation() {
  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen text-[#1F3D2B] font-sans selection:bg-[#D9A441] selection:text-[#1F3D2B] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className="relative bg-[#162B1D] text-white py-20 px-6 sm:px-12 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80')`,
            }}
          />
          <div className="relative max-w-4xl mx-auto text-center">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D9A441] font-semibold block mb-3">
              Conservation First
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#F6F1E7] mb-6 leading-tight">
              Preserving Natural Habitats for Generations to Come
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
              Every safari booked through WildBook directly contributes to wildlife habitat management, anti-poaching patrols, and local community eco-livelihoods.
            </p>
          </div>
        </div>

        {/* ── Conservation Pillars ────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D9A441] block mb-2">
              Our 4 Conservation Pillars
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#1F3D2B]">
              Ethical Safaris That Give Back to Nature
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E5DAC6] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B]/5 text-[#1F3D2B] flex items-center justify-center mb-4">
                  <ElephantIcon className="w-6 h-6 text-[#1F3D2B]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1F3D2B] mb-2">
                  Zero Stress Protocol
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Vehicles must maintain minimum 30-meter clearance from all wildlife. No engine revving, off-trail driving, or intrusive artificial lighting.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E5DAC6] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B]/5 text-[#1F3D2B] flex items-center justify-center mb-4">
                  <TreeIcon className="w-6 h-6 text-[#1F3D2B]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1F3D2B] mb-2">
                  Habitat Restoration
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  A portion of every booking fee is directed into native flora restoration and waterhole rejuvenation across dry sanctuary zones.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E5DAC6] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B]/5 text-[#1F3D2B] flex items-center justify-center mb-4">
                  <UserIcon className="w-6 h-6 text-[#1F3D2B]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1F3D2B] mb-2">
                  Community Guides
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  All safari trackers and naturalists are certified indigenous community members, empowering local forest-dwelling communities.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E5DAC6] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B]/5 text-[#1F3D2B] flex items-center justify-center mb-4">
                  <BarChartIcon className="w-6 h-6 text-[#1F3D2B]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1F3D2B] mb-2">
                  Transparent Auditing
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Government wildlife authorities review revenue allocations, capacity limits, and visitor feedback to guarantee ethical compliance.
                </p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-16 bg-[#FAF8F5] rounded-3xl p-8 sm:p-12 border border-[#E5DAC6] text-center max-w-3xl mx-auto">
            <h3 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-3">
              Ready to witness India's extraordinary wildlife?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-lg mx-auto">
              Choose from tiger reserves, elephant sanctuaries, and bird havens managed with certified conservation protocols.
            </p>
            <Link
              to="/sanctuaries"
              className="px-6 py-3 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-md"
            >
              Explore Verified Sanctuaries &rarr;
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
