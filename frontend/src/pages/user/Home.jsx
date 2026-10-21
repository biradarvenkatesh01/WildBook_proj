import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import client from '../../api/client';

// Animal photo slides for Hero Carousel
const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1800&q=85',
    title: 'Bengal Tiger in Dawn Mist',
    location: 'Nagarhole National Park, Karnataka',
  },
  {
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1800&q=85',
    title: 'Asiatic Elephants of Kabini River',
    location: 'Nilgiri Biosphere Reserve',
  },
  {
    image: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1800&q=85',
    title: 'Indian Leopard on Forest Canopy',
    location: 'Bandipur Tiger Reserve',
  },
  {
    image: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1800&q=85',
    title: 'Spotted Deer in Morning Sunbeams',
    location: 'Western Ghats Wilderness',
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSanctuaries, setFeaturedSanctuaries] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const navigate = useNavigate();

  // 1. Auto-slide carousel every 5 seconds, pauses on hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // 2. Fetch featured approved sanctuaries from backend
  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoadingFeatured(true);
        const res = await client.get('/sanctuaries/featured?limit=3');
        setFeaturedSanctuaries(res.sanctuaries || []);
      } catch (err) {
        console.warn('Failed to load featured sanctuaries:', err);
      } finally {
        setLoadingFeatured(false);
      }
    }
    loadFeatured();
  }, []);

  // Handle #experiences hash scroll on landing
  useEffect(() => {
    if (window.location.hash === '#experiences') {
      const el = document.getElementById('experiences');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/sanctuaries?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/sanctuaries');
    }
  };

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen text-[#1F3D2B] font-sans selection:bg-[#D9A441] selection:text-[#1F3D2B]">
      <Navbar />

      {/* ════════════════════════════════════════════════════════════════════════
          1. HERO CAROUSEL (Image 01: slides left, auto 5s, pause on hover)
      ════════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative h-[82vh] min-h-[560px] max-h-[800px] overflow-hidden bg-[#1F3D2B]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Horizontal Sliding Filmstrip (translateX) */}
        <div
          className="flex h-full transition-transform duration-1000 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, idx) => (
            <div key={idx} className="w-full h-full shrink-0 relative">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
              {/* Deep Cinematic Forest Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F3D2B]/80 via-transparent to-black/30" />
            </div>
          ))}
        </div>

        {/* Fixed Hero Overlay Content (Headline, Subtitle, Search bar) */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
            <div className="max-w-2xl space-y-5">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D9A441] text-xs font-semibold uppercase tracking-widest">
                <span>Wild by Nature. Protected by Purpose.</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-white font-bold leading-[1.08] drop-shadow-md">
                Discover Wildlife. <br />
                <span className="text-[#D9A441] italic font-normal">Preserve Tomorrow.</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl font-normal drop-shadow-xs">
                WildBook connects you to India’s most extraordinary wildlife sanctuaries and authorized safari experiences that inspire awe and protect our endangered habitats.
              </p>

              {/* Fixed Search Bar over Hero */}
              <form onSubmit={handleSearchSubmit} className="pt-2 max-w-lg">
                <div className="flex items-center bg-white p-2 rounded-2xl shadow-2xl border border-white/30 backdrop-blur-sm">
                  <div className="pl-3 text-gray-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search sanctuaries, tiger reserves, or safari tours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-[#D9A441] hover:bg-[#c99534] text-[#1F3D2B] font-bold text-xs sm:text-sm transition shadow-sm shrink-0 active:scale-95"
                  >
                    Explore
                  </button>
                </div>
              </form>

              {/* Call to Action Link */}
              <div className="pt-2">
                <Link
                  to="/sanctuaries"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-[#D9A441] transition group"
                >
                  <span>Browse all approved wildlife reserves</span>
                  <span className="group-hover:translate-x-1 transition">&rarr;</span>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          {HERO_SLIDES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentSlide(dotIdx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === dotIdx
                  ? 'w-8 bg-[#D9A441]'
                  : 'w-2 bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          2. FEATURED SANCTUARIES (Image 01: Places of Refuge, Beauty & Balance)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D9A441] block mb-2">
            OUR SANCTUARIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            Places of Refuge, Beauty &amp; Balance
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2.5">
            Each sanctuary is a safe haven for wildlife and a living example of conservation in action.
          </p>
        </div>

        {/* Featured Sanctuaries Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingFeatured ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/60 animate-pulse border border-[#E5DAC6]" />
            ))
          ) : featuredSanctuaries.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500 text-sm">
              Discover sanctuaries across India under our public directory.
            </div>
          ) : (
            featuredSanctuaries.map((s) => (
              <Link
                key={s.sanctuary_id}
                to={`/sanctuaries/${s.sanctuary_id}`}
                className="group relative h-80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-end p-6 border border-[#E5DAC6]/70"
              >
                {/* Background Image */}
                <img
                  src={s.cover_image || 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80'}
                  alt={s.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                {/* Content */}
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#D9A441] tracking-wider uppercase">
                      Reserve
                    </span>
                    <span className="text-xs bg-black/50 px-2 py-0.5 rounded-md font-bold backdrop-blur-xs">
                      ⭐ {s.average_rating > 0 ? s.average_rating : '4.8'}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-[#D9A441] transition truncate">
                    {s.name}
                  </h3>
                  <p className="text-xs text-gray-300 truncate mt-0.5 mb-3">
                    {s.location}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/20 text-xs">
                    <span className="text-gray-200">
                      from <strong className="text-[#D9A441]">₹{Number(s.starting_price || 1500).toLocaleString('en-IN')}</strong> / person
                    </span>
                    <span className="font-semibold text-[#D9A441] group-hover:translate-x-1 transition">
                      View reserve &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/sanctuaries"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1F3D2B] text-white hover:bg-[#152a1d] font-semibold text-xs transition shadow-xs"
          >
            <span>Explore All Sanctuaries</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          CHOOSE HOW YOU WANT TO CONTINUE (Portal Gateway)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#F6F1E7]/70 border-t border-[#E5DAC6]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D9A441] block mb-1">
              PORTAL GATEWAY
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#1F3D2B]">
              Choose how you want to continue
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              Whether exploring India&apos;s wildlife or managing an authorized sanctuary, access your dedicated platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: I'm a traveller */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5DAC6] shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F6F1E7] border border-[#E5DAC6]/70 flex items-center justify-center text-[#1F3D2B] mb-5">
                  <svg className="w-6 h-6 text-[#1F3D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25l-4.5 4.5m0 0l-4.5-4.5m4.5 4.5v-7.5" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mb-2">
                  I&apos;m a traveller
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Discover public reserves, reserve certified safari slots, and track your confirmed bookings.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl border border-[#1F3D2B] text-[#1F3D2B] font-semibold text-xs hover:bg-[#1F3D2B] hover:text-white transition shadow-2xs"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition shadow-2xs"
                >
                  Sign up
                </Link>
              </div>
            </div>

            {/* Card 2: I run a sanctuary */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5DAC6] shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F6F1E7] border border-[#E5DAC6]/70 flex items-center justify-center text-[#1F3D2B] mb-5">
                  <svg className="w-6 h-6 text-[#1F3D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A12.062 12.062 0 0012 9c-2.485 0-4.81.755-6.75 2.052V21" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mb-2">
                  I run a sanctuary
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Manage reserve information, schedule slots, assign naturalist guides, and oversee bookings.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Link
                  to="/admin/login"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl border border-[#1F3D2B] text-[#1F3D2B] font-semibold text-xs hover:bg-[#1F3D2B] hover:text-white transition shadow-2xs"
                >
                  Admin login
                </Link>
                <Link
                  to="/admin/signup"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-[#1F3D2B] text-white font-semibold text-xs hover:bg-[#152a1d] transition shadow-2xs"
                >
                  Register your sanctuary
                </Link>
              </div>
            </div>

          </div>

          {/* Slim quiet authority line underneath */}
          <div className="text-center mt-8 pt-4 border-t border-[#E5DAC6]/60">
            <p className="text-xs text-gray-500">
              Government authority?{' '}
              <Link
                to="/owner/login"
                className="font-semibold text-[#1F3D2B] hover:text-[#D9A441] underline underline-offset-2 transition"
              >
                Authority login &rarr;
              </Link>
            </p>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. WAYS TO EXPLORE (Safari Experiences)
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="experiences" className="py-16 bg-[#EDE5D8]/50 border-y border-[#E5DAC6] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D9A441] block mb-1">
              CURATED EXPERIENCES
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#1F3D2B]">
              Ways to Explore the Wild
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              From open 4x4 jeeps to serene river boats, choose your ideal safari perspective.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: '🚙',
                title: '4x4 Open Jeep Safaris',
                activityType: 'jeep',
                desc: 'Deep exploration into core forest zones led by certified naturalists and local trackers.',
              },
              {
                icon: '🚤',
                title: 'River Boat Expeditions',
                activityType: 'boat',
                desc: 'Glide along backwaters observing elephant herds bathing, marsh crocodiles, and waterbirds.',
              },
              {
                icon: '🥾',
                title: 'Guided Birding & Nature Walks',
                activityType: 'walk',
                desc: 'Dawn walks through buffer tracks discovering endemic butterflies, rare flora, and calls.',
              },
              {
                icon: '🚌',
                title: 'Wilderness Canter Tours',
                activityType: 'canter',
                desc: 'Elevated open bus safaris perfect for families and small groups visiting tourism zones.',
              },
            ].map((exp, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-[#E5DAC6] shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#F6F1E7] flex items-center justify-center text-2xl mb-4 border border-[#E5DAC6]/60">
                    {exp.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1F3D2B] mb-2">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {exp.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100">
                  <Link
                    to={`/sanctuaries?activity=${encodeURIComponent(exp.activityType)}`}
                    className="text-xs font-semibold text-[#D9A441] hover:text-[#b88628] flex items-center gap-1 group"
                  >
                    <span>View experiences</span>
                    <span className="group-hover:translate-x-1 transition">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          4. HOW IT WORKS (3 Simple Steps)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D9A441] block mb-1">
            RESERVATION PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            Book Your Safari in 3 Easy Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              num: '01',
              title: 'Discover Sanctuaries',
              desc: 'Browse government authorized reserves, inspect gallery photos, operating hours, and safari activities.',
            },
            {
              num: '02',
              title: 'Select Date & Live Slot',
              desc: 'Pick your preferred date on the live calendar and select open seats with your designated guide and vehicle.',
            },
            {
              num: '03',
              title: 'Instant Pass & Entry',
              desc: 'Complete reservation details and receive your official digital booking ID for seamless gate check-in.',
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-[#E5DAC6] shadow-xs relative flex flex-col justify-between"
            >
              <div>
                <span className="font-serif text-4xl font-bold text-[#D9A441] block mb-4">
                  {step.num}
                </span>
                <h3 className="text-lg font-serif font-bold text-[#1F3D2B] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-[11px] font-semibold text-emerald-800">
                <span>Verified by Forestry Authority</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          5. TESTIMONIALS (Visitor Experiences)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#1F3D2B] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D9A441] block mb-1">
              COMMUNITY VOICES
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              Moments That Stay Forever
            </h2>
            <p className="text-xs text-gray-300 mt-2">
              Real safari reflections shared by wildlife enthusiasts across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Ananya Sharma',
                loc: 'Bengaluru, Karnataka',
                quote: 'Witnessing a tigress crossing the Kabini backwaters at dawn was breathtaking. The digital booking through WildBook was effortless.',
                stars: 5,
              },
              {
                name: 'Dr. Vikram Malhotra',
                loc: 'Mumbai, Maharashtra',
                quote: 'The naturalists assigned to our jeep were exceptionally knowledgeable about elephant corridors. Truly responsible eco-tourism.',
                stars: 5,
              },
              {
                name: 'Pooja Iyer',
                loc: 'Chennai, Tamil Nadu',
                quote: 'Clear slot capacities and zero overbooking meant our family safari had unobstructed views throughout the core jungle tracks.',
                stars: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xs flex flex-col justify-between"
              >
                <div>
                  <div className="text-[#D9A441] text-sm mb-3">
                    {'★'.repeat(t.stars)}
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D9A441] text-[#1F3D2B] flex items-center justify-center font-bold text-xs shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">{t.name}</span>
                    <span className="block text-[10px] text-gray-400">{t.loc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
