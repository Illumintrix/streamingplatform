import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-dark border-b border-lightgray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-primary text-xl font-bold cursor-pointer">
                  Stream<span className="text-accent">Hub</span>
                </span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-light hover:bg-secondary hover:text-white transition-colors">
                Browse
              </Link>
              <Link href="/following" className="px-3 py-2 rounded-md text-sm font-medium text-light hover:bg-secondary hover:text-white transition-colors">
                Following
              </Link>
              <Link href="/categories" className="px-3 py-2 rounded-md text-sm font-medium text-light hover:bg-secondary hover:text-white transition-colors">
                Categories
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative mx-2">
              <Input 
                type="text" 
                placeholder="Search" 
                className="bg-secondary border-none rounded-md py-1 px-3 text-light text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 w-40 md:w-60"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light">
                <Search className="h-4 w-4" />
              </span>
            </div>
            <Button 
              className="bg-primary hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors hidden md:block"
            >
              Go Live
            </Button>
            <div className="ml-3 relative">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 bg-secondary">
                  <AvatarImage 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                    alt="User avatar" 
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-lightgray">
          <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-light hover:bg-secondary hover:text-white">
            Browse
          </Link>
          <Link href="/following" className="block px-3 py-2 rounded-md text-base font-medium text-light hover:bg-secondary hover:text-white">
            Following
          </Link>
          <Link href="/categories" className="block px-3 py-2 rounded-md text-base font-medium text-light hover:bg-secondary hover:text-white">
            Categories
          </Link>
        </div>
      </div>
    </nav>
  );
}
