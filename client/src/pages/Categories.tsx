import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import StreamCard from "@/components/StreamCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { type ClientStream } from "@shared/schema";

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });
  
  const { data: streams, isLoading: streamsLoading } = useQuery<ClientStream[]>({
    queryKey: [selectedCategory ? `/api/streams?category=${selectedCategory}` : '/api/streams'],
    enabled: !!selectedCategory,
  });
  
  return (
    <div className="min-h-screen bg-dark text-light">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mt-8 mb-6">
          Browse by Category
        </h1>
        
        {categoriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
              {categories.map(category => (
                <Card 
                  key={category} 
                  className={`overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    selectedCategory === category ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                >
                  <div className="h-32 bg-secondary flex items-center justify-center overflow-hidden">
                    <img 
                      src={getCategoryImage(category)} 
                      alt={category}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent opacity-60" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{category}</h3>
                    <p className="text-sm text-gray-400">{getCategoryStreamCount(category)} streams</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedCategory && (
              <>
                <h2 className="text-xl font-semibold mb-4">{selectedCategory} Streams</h2>
                
                {streamsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
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
                  <div className="text-center py-8 bg-secondary/20 rounded-lg">
                    <p className="text-gray-400">No streams found in this category</p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get fake image URL for categories
function getCategoryImage(category: string): string {
  const images = {
    Gaming: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    Music: "https://images.unsplash.com/photo-1511881830150-850572962174?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80", 
    // Default image
    default: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
  };
  
  return images[category as keyof typeof images] || images.default;
}

// Helper function to get fake stream count for categories
function getCategoryStreamCount(category: string): number {
  const counts = {
    Gaming: 120,
    Music: 84,
    Food: 42,
    default: 25
  };
  
  return counts[category as keyof typeof counts] || counts.default;
}