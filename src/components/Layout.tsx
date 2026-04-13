import { useState, useRef, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { useQuery } from "@tanstack/react-query";
import * as cartService from "../services/cartService";
import api from "../services/axios";

const Layout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getCart,
    enabled: !!user,
  });

  const cartCount = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setShowUserMenu(false);
    setShowMoreMenu(false);
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  useEffect(() => {
    if (debouncedSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(debouncedSearch.trim())}`);
    }
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* logo */}
          <Link to="/" className="text-base font-medium text-gray-900 shrink-0">
            Ecom
          </Link>

          {/* desktop search */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* right side */}
          <div className="flex items-center gap-1 ml-auto">

            {/* mobile search toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* more — desktop only */}
            <div className="hidden md:block relative" ref={moreMenuRef}>
              <button
                onMouseEnter={() => setShowMoreMenu(true)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
              >
                More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showMoreMenu && (
                <div
                  onMouseLeave={() => setShowMoreMenu(false)}
                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-sm py-1 z-50"
                >
                  <a
                    href={import.meta.env.VITE_SELLER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    Become a seller
                  </a>
                </div>
              )}
            </div>

            {/* cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* desktop user menu */}
            {user ? (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onMouseEnter={() => setShowUserMenu(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-24 truncate">{user.name || user.email}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showUserMenu && (
                  <div
                    onMouseLeave={() => setShowUserMenu(false)}
                    className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-sm py-1 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900 truncate">{user.name || "User"}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      Profile
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      My orders
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden md:block text-sm text-gray-600 hover:text-gray-900 transition-colors px-2">
                Login
              </Link>
            )}

            {/* mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showMobileMenu ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* mobile search bar */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        )}

        {/* mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white py-2">
            {user ? (
              <>
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-medium text-gray-900">{user.name || "User"}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Profile
                </Link>
                <Link to="/orders" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  My orders
                </Link>
                <a
                  href={import.meta.env.VITE_SELLER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Become a seller
                </a>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Login
                </Link>
                <a
                  href={import.meta.env.VITE_SELLER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Become a seller
                </a>
              </>
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;