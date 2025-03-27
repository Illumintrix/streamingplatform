import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoriesBarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function CategoriesBar({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoriesBarProps) {
  if (categories.length === 0) {
    return (
      <div className="mb-6 overflow-x-auto flex space-x-3 pb-2">
        <Skeleton className="w-16 h-10" />
        <Skeleton className="w-20 h-10" />
        <Skeleton className="w-24 h-10" />
        <Skeleton className="w-18 h-10" />
      </div>
    );
  }
  
  return (
    <div className="mb-6 overflow-x-auto hide-scrollbar">
      <div className="flex space-x-3 pb-2" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <Button
          variant={selectedCategory === null ? "default" : "secondary"}
          className={`px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 hover:bg-purple-700 transition-colors ${
            selectedCategory === null ? 'bg-primary text-white' : 'bg-secondary text-light hover:bg-lightgray'
          }`}
          onClick={() => onSelectCategory(null)}
        >
          All
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "secondary"}
            className={`px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-colors ${
              selectedCategory === category ? 'bg-primary text-white' : 'bg-secondary text-light hover:bg-lightgray'
            }`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
