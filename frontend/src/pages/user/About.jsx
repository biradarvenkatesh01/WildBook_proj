import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { LeafIcon, ElephantIcon, ShieldIcon } from '../../components/Icons';

export default function About() {
  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen text-[#1F3D2B] font-sans selection:bg-[#D9A441] selection:text-[#1F3D2B] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className="relative bg-[#162B1D] text-white py-20 px-6 sm:px-12 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80')`,
            }}
          />
          <div className="relative max-w-4xl mx-auto text-center">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D9A441] font-semibold block mb-3">
              About WildBook
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#F6F1E7] mb-6 leading-tight">
              Wild by Nature. Protected by Purpose.
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
              WildBook connects conscious travellers with authentic wildlife sanctuaries and conservation reserves, creating transparent pathways for sustainable eco-tourism.
            </p>
          </div>
        </div>

        {/* ── Mission & Vision ────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#D9A441] block mb-2">
                Our Purpose
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#1F3D2B] mb-6">
                Bridging responsible tourism with forest sanctuary preservation
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                WildBook was founded with a singular conviction: when safari tourism is transparent, strictly regulated, and directly linked to sanctuary authorities, wildlife thrives.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                Every sanctuary registered on our platform is officially vetted by wildlife conservation authorities. Every permit slot adheres to ecological carrying-capacity constraints, ensuring wildlife habitats are respected and protected.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  to="/sanctuaries"
                  className="px-6 py-3 rounded-xl bg-[#1F3D2B] text-white font-semibold text-xs hover:bg-[#162B1D] transition shadow-md"
                >
                  Explore Sanctuaries &rarr;
                </Link>
                <Link
                  to="/conservation"
                  className="px-6 py-3 rounded-xl border border-[#1F3D2B] text-[#1F3D2B] font-semibold text-xs hover:bg-[#1F3D2B]/5 transition"
                >
                  Conservation Pledge
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-[#E5DAC6] shadow-sm space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-center shrink-0">
                  <LeafIcon className="w-5 h-5 text-[#1F3D2B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1F3D2B] mb-1">
                    Direct Sanctuary Partnership
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Permits and activity slots are directly issued by accredited sanctuary operators, preventing unauthorised ticketing and inflated fees.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-center shrink-0">
                  <ElephantIcon className="w-5 h-5 text-[#1F3D2B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1F3D2B] mb-1">
                    Habitat Carrying Capacity
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Strict vehicle caps per safari slot prevent overcrowding, reducing animal stress and safeguarding sensitive breeding zones.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-center shrink-0">
                  <ShieldIcon className="w-5 h-5 text-[#1F3D2B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1F3D2B] mb-1">
                    Authority Oversight
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    National conservation bodies actively monitor operator licenses, vehicle safety standards, and naturalist accreditations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
