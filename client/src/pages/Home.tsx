import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import CategoriesBar from "@/components/CategoriesBar";
import StreamCard from "@/components/StreamCard";
import { Skeleton } from "@/components/ui/skeleton";
import { type ClientStream } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [location] = useLocation();
  
  // Extract search query from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    setSearchTerm(search);
  }, [location]);
  
  const { data: streams, isLoading } = useQuery<ClientStream[]>({
    queryKey: [selectedCategory ? `/api/streams?category=${selectedCategory}` : '/api/streams'],
  });
  
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });
  
  // Filter streams based on search term if present
  const filteredStreams = streams && searchTerm 
    ? streams.filter(stream => 
        stream.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (stream.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (stream.category?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (stream.streamer?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (stream.streamer?.username.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : streams;
  
  // Determine page title based on search or category
  const pageTitle = searchTerm 
    ? `Search Results for "${searchTerm}"` 
    : (selectedCategory ? `${selectedCategory} Streams` : 'Live Streams');
  
  return (
    <div className="min-h-screen bg-dark text-light">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!searchTerm && (
          <CategoriesBar 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => setSelectedCategory(category)}
          />
        )}
        
        <h1 className="text-2xl font-bold mt-8 mb-6">
          {pageTitle}
        </h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-darkgray rounded-lg overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStreams && filteredStreams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredStreams.map(stream => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? `No streams found matching "${searchTerm}"` : "No streams found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
