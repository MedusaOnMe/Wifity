import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@shared/schema";
import { downloadImage } from "@/lib/image-utils";

export default function GallerySection() {
  const { data: images, isLoading } = useQuery({
    queryKey: ['/api/images'],
  });

  // Only show up to 3 most recent images in this section
  const recentImages = images?.slice(0, 3) || [];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-2xl">Recent Creations</h2>
        <Link href="/gallery">
          <a className="text-[#06B6D4] text-sm flex items-center gap-1 hover:underline">
            View All <i className="ri-arrow-right-line"></i>
          </a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="glass">
              <div className="h-56 bg-[#334155]/30 animate-pulse"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-[#334155]/30 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-[#334155]/30 animate-pulse rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recentImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentImages.map((image: Image) => (
            <Card key={image.id} className="glass rounded-xl overflow-hidden group relative">
              <img 
                src={image.url} 
                alt={image.prompt.slice(0, 50)} 
                className="w-full h-56 object-cover"
              />
              <CardContent className="p-4">
                <p className="font-medium line-clamp-2 text-sm">{image.prompt}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(image.createdAt).toLocaleString(undefined, {
                      timeStyle: 'short',
                      dateStyle: 'medium'
                    })}
                  </span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => downloadImage(image.url, `neuralcanvas-${image.id}`)}
                      className="p-1.5 rounded-lg bg-[#334155] hover:bg-[#475569] transition-colors"
                    >
                      <i className="ri-download-line text-sm"></i>
                    </button>
                    <button className="p-1.5 rounded-lg bg-[#334155] hover:bg-[#475569] transition-colors">
                      <i className="ri-share-line text-sm"></i>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <p>No images yet. Generate your first image above!</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
