import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import CategoriesBar from "@/components/CategoriesBar";
import StreamCard from "@/components/StreamCard";
import { Skeleton } from "@/components/ui/skeleton";
import { type ClientStream } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: streams, isLoading } = useQuery<ClientStream[]>({
    queryKey: [selectedCategory ? `/api/streams?category=${selectedCategory}` : '/api/streams'],
  });
  
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });
  
  return (
    <div className="min-h-screen bg-dark text-light">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CategoriesBar 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => setSelectedCategory(category)}
        />
        
        <h1 className="text-2xl font-bold mt-8 mb-6">
          {selectedCategory ? `${selectedCategory} Streams` : 'Live Streams'}
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
        ) : streams && streams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {streams.map(stream => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No streams found</p>
          </div>
        )}
      </div>
    </div>
  );
}
