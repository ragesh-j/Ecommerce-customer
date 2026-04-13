import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import * as productService from "../services/productService";
import * as categoryService from "../services/categoryService";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: { name: string; slug: string };
  seller: { storeName: string };
  variants: { price: number; stock: number }[];
  media: { url: string }[];
  avgRating: number | null;
  reviewCount: number;
  isFeatured: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const featured = searchParams.get("featured") === "true";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [debouncedMin] = useDebounce(minPrice, 500);
  const [debouncedMax] = useDebounce(maxPrice, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, categoryId, featured, sort, page, debouncedMin, debouncedMax],
    queryFn: () => productService.getProducts({
      search: search || undefined,
      categoryId: categoryId || undefined,
      featured: featured || undefined,
      sort: (sort as any) || undefined,
      page,
      limit: 12,
      minPrice: debouncedMin ? Number(debouncedMin) : undefined,
      maxPrice: debouncedMax ? Number(debouncedMax) : undefined,
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const products: Product[] = data?.products || [];
  const pagination = data?.pagination;

  const flatCategories = categories.flatMap((c: Category) => [
    c,
    ...(c.children || []),
  ]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    setSearchParams(params);
  };

  const hasFilters = categoryId || featured || sort || minPrice || maxPrice;

  const FilterContent = () => (
    <>
      <h2 className="text-sm font-medium text-gray-900 mb-4">Filters</h2>

      {/* category */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Category</p>
        <div className="space-y-1">
          <button
            onClick={() => updateParam("categoryId", "")}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
              !categoryId ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All categories
          </button>
          {flatCategories.map((c: Category) => (
            <button
              key={c.id}
              onClick={() => updateParam("categoryId", c.id)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                categoryId === c.id ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* price range */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Price range</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* sort */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Sort by</p>
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Newest</option>
          <option value="bestseller">Best seller</option>
        </select>
      </div>

      {/* featured */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => updateParam("featured", e.target.checked ? "true" : "")}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Featured only</span>
        </label>
      </div>

      {/* clear filters */}
      {hasFilters && (
        <button
          onClick={() => {
            setSearchParams({});
            setMinPrice("");
            setMaxPrice("");
          }}
          className="w-full mt-4 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear filters
        </button>
      )}
    </>
  );

  return (
    <div>

      {/* mobile filter toggle */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <p className="text-sm text-gray-500">
          {pagination ? `${pagination.total} products` : "Loading..."}
          {search && <span> for "<span className="text-gray-900">{search}</span>"</span>}
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filters {hasFilters && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* mobile filters dropdown */}
      {showFilters && (
        <div className="md:hidden bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <FilterContent />
        </div>
      )}

      <div className="flex gap-6">

        {/* desktop sidebar filters */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
            <FilterContent />
          </div>
        </aside>

        {/* main content */}
        <div className="flex-1">

          {/* desktop header */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {pagination ? `${pagination.total} products found` : "Loading..."}
              {search && <span> for "<span className="text-gray-900">{search}</span>"</span>}
            </p>
          </div>

          {/* products grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">No products found.</p>
              <button
                onClick={() => { setSearchParams({}); setMinPrice(""); setMaxPrice(""); }}
                className="text-blue-600 text-sm hover:underline mt-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {products.map((product: Product) => (
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

              {/* pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => updateParam("page", String(page - 1))}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam("page", String(p))}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => updateParam("page", String(page + 1))}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;