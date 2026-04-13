import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as bannerService from "../services/bannerService";
import * as productService from "../services/productService";
import * as categoryService from "../services/categoryService";

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  category: { name: string; slug: string };
  seller: { storeName: string };
  variants: { price: number; stock: number }[];
  media: { url: string }[];
  avgRating: number | null;
  reviewCount: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

const Home = () => {
  const [currentBanner, setCurrentBanner] = useState(0);

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: bannerService.getActiveBanners,
  });

  const { data: featuredData } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productService.getProducts({ featured: true, limit: 8 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const featuredProducts: Product[] = featuredData?.products || [];

  useEffect(() => {
  if (banners.length <= 1) return;
  const interval = setInterval(() => {
    setCurrentBanner((prev) => {
      if (prev >= banners.length - 1) return 0;
      return prev + 1;
    });
  }, 4000);
  return () => clearInterval(interval);
}, [banners.length]);

  return (
    <div className="space-y-8 md:space-y-10">

      {/* banner slider */}
      {/* banner slider - mobile */}
{banners.length > 0 && (
  <>
    {/* mobile - full slider */}
    <div className="md:hidden relative rounded-2xl overflow-hidden bg-gray-100 h-48">
      {banners.map((banner: Banner, index: number) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentBanner ? "opacity-100" : "opacity-0"
          }`}
        >
          {banner.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} loading="eager" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h2 className="text-xl font-medium text-white mb-1">{banner.title}</h2>
            {banner.subtitle && <p className="text-white/80 text-xs mb-2">{banner.subtitle}</p>}
            {banner.linkUrl && (
              <a href={banner.linkUrl} className="inline-block px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors">
                Shop now
              </a>
            )}
          </div>
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_: Banner, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentBanner ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>

    {/* desktop - horizontal scrollable cards */}
    {/* desktop - horizontal auto scroll */}
<div className="hidden md:block relative overflow-hidden rounded-2xl">
  <div
    className="flex transition-transform duration-500 ease-in-out"
    style={{ transform: `translateX(-${currentBanner * (384 + 16)}px)` }}
  >
    {/* render banners twice for seamless loop */}
    {[...banners, ...banners].map((banner: Banner, index: number) => (
      <div key={`${banner.id}-${index}`} className="relative rounded-2xl overflow-hidden bg-gray-100 shrink-0 w-96 h-52 mr-4">
        {banner.imageUrl && (
          <img src={banner.imageUrl} alt={banner.title} loading="eager" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h2 className="text-lg font-medium text-white mb-1">{banner.title}</h2>
          {banner.subtitle && <p className="text-white/80 text-xs mb-2">{banner.subtitle}</p>}
          {banner.linkUrl && (
            <a href={banner.linkUrl} className="inline-block px-4 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Shop now
            </a>
          )}
        </div>
      </div>
    ))}
  </div>

  {/* dots */}
  {banners.length > 1 && (
    <div className="absolute bottom-3 right-4 flex gap-1.5">
      {banners.map((_: Banner, index: number) => (
        <button
          key={index}
          onClick={() => setCurrentBanner(index)}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentBanner ? "bg-white" : "bg-white/40"}`}
        />
      ))}
    </div>
  )}
</div>
  </>
)}

      {/* categories */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shop by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((category: Category) => (
              <Link
                key={category.id}
                to={`/products?categoryId=${category.id}`}
                className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 text-center hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7h18M3 12h18M3 17h18" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-900">{category.name}</p>
                {category.children && category.children.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 hidden md:block">
                    {category.children.length} subcategories
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* featured products */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Featured products</h2>
            <Link to="/products?featured=true" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featuredProducts.map((product: Product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.media[0] ? (
                    <img
                      src={product.media[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{product.seller.storeName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{Number(product.variants[0]?.price).toLocaleString()}
                    </p>
                    {product.avgRating && (
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-xs text-gray-500">{product.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* empty state */}
      {banners.length === 0 && featuredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">No content yet. Check back soon!</p>
        </div>
      )}

    </div>
  );
};

export default Home;