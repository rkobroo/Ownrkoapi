import Header from "@/components/header";
import Footer from "@/components/footer";
import DownloadForm from "@/components/download-form";
import DownloadQueue from "@/components/download-queue";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DownloadForm />
        <DownloadQueue />

        {/* Features Section */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">Why Choose SnapTube?</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bolt text-blue-600 text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Lightning Fast</h4>
              <p className="text-slate-600">Download videos at maximum speed with our optimized servers and advanced compression.</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-green-600 text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">100% Safe</h4>
              <p className="text-slate-600">No malware, no ads, no tracking. Your privacy and security are our top priorities.</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mobile-alt text-violet-600 text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Mobile Optimized</h4>
              <p className="text-slate-600">Works perfectly on all devices - desktop, tablet, and mobile phones.</p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-8 text-white text-center mb-8">
          <h3 className="text-2xl font-bold mb-6">Trusted by Millions Worldwide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold mb-1">500M+</div>
              <div className="text-blue-100">Downloads</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50M+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">10+</div>
              <div className="text-blue-100">Platforms Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
