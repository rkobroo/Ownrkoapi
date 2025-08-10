import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <i className="fas fa-download text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">SnapTube</h1>
              <p className="text-xs text-slate-500">Video Downloader</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium">Home</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium">Features</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium">Support</a>
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              Download App
            </Button>
          </nav>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-2">
                <i className="fas fa-bars text-slate-600"></i>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                <a href="#" className="text-slate-600 hover:text-blue-600 font-medium">Home</a>
                <a href="#" className="text-slate-600 hover:text-blue-600 font-medium">Features</a>
                <a href="#" className="text-slate-600 hover:text-blue-600 font-medium">Support</a>
                <Button className="bg-blue-500 text-white hover:bg-blue-600 w-full">
                  Download App
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
