import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="theme-user flex flex-col min-h-screen bg-[#FBF8F2] text-[#2C332D]">
      <Navbar />

      <main className="flex-1 relative flex items-center overflow-hidden">
        
        {/* Decorative botanical watermark SVG in left margin */}
        <div className="absolute left-0 bottom-0 pointer-events-none opacity-20 transform -translate-x-12 translate-y-12">
          <svg className="w-80 h-80 text-[#1F3D2B]" viewBox="0 0 200 200" fill="currentColor">
            <path d="M40,160 C50,130 80,110 110,120 C100,90 120,60 150,50 C130,50 110,60 90,80 C80,60 60,60 40,70 C50,90 50,110 30,130 Z" />
            <path d="M20,180 C40,150 70,140 100,150 C80,120 100,90 130,80 C110,80 90,90 70,110 C60,90 40,90 20,100 C30,120 30,140 10,160 Z" opacity="0.6" />
          </svg>
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: 404 Text & Call-To-Action (Matching Image 25) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <span className="font-serif font-bold text-7xl md:text-9xl text-[#1F3D2B] tracking-tight block leading-none">
                404
              </span>
              <div className="flex items-center gap-2 mt-3 text-[#D9A441]">
                <span className="h-px w-10 bg-[#D9A441]"></span>
                <span className="text-sm">🍃</span>
                <span className="h-px w-10 bg-[#D9A441]"></span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#1F3D2B] leading-tight">
                This trail leads nowhere
              </h1>
              <p className="text-sm md:text-base text-gray-600 max-w-md leading-relaxed">
                The page you&apos;re looking for seems to have wandered off into the wild. Let&apos;s get you back on track.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D9A441] text-white font-semibold text-sm hover:bg-[#c49235] shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                <span>&rarr;</span>
                <span>Back to home</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Wildlife Fox on Woodland Trail (Matching Image 25) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 max-w-lg w-full group">
              <img
                src="/fox-404.jpg"
                alt="A wild red fox cub on a forest trail"
                className="w-full h-80 md:h-96 object-cover object-center transform group-hover:scale-105 transition duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 text-white text-xs font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1.5">
                <span>🦊</span>
                <span>Lost in the wild</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
