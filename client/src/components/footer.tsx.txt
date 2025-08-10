export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <i className="fas fa-download text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-white">SnapTube</span>
            </div>
            <p className="text-slate-400 mb-4">The ultimate video downloader for all your favorite social media platforms.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-slate-400 hover:text-white"><i className="fab fa-facebook"></i></a>
              <a href="#" className="text-slate-400 hover:text-white"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold text-white mb-4">Features</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">YouTube Downloader</a></li>
              <li><a href="#" className="hover:text-white">Instagram Downloader</a></li>
              <li><a href="#" className="hover:text-white">TikTok Downloader</a></li>
              <li><a href="#" className="hover:text-white">Facebook Downloader</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold text-white mb-4">Support</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Bug Report</a></li>
              <li><a href="#" className="hover:text-white">Feature Request</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold text-white mb-4">Legal</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Copyright</a></li>
              <li><a href="#" className="hover:text-white">DMCA</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2025 SnapTube. All rights reserved. | Made with ❤️ for content creators</p>
        </div>
      </div>
    </footer>
  );
}
