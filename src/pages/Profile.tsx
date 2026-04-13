import { useState, useActionState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setCredentials } from "../features/auth/authSlice";
import * as userService from "../services/userService";

type Address = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  accounts: { provider: string }[];
  passwordHash?: string;
};

const Profile = () => {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const queryClient = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "password">("profile");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["profile"],
    queryFn: userService.getProfile,
  });

  const { data: addressData, refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: userService.getAddresses,
  });

  const addresses: Address[] = addressData || [];

  const { mutate: deleteAddress } = useMutation({
    mutationFn: userService.deleteAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  const isGoogleUser = user?.accounts?.some((a) => a.provider === "google");
  const hasPassword = !!user?.passwordHash;

  const [profileError, profileAction, isProfilePending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        const updated = await userService.updateProfile({
          name: formData.get("name") as string,
        });
        dispatch(setCredentials({
          token: token!,
          user: { ...authUser!, name: updated.name },
        }));
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        return null;
      } catch (err: any) {
        return err.response?.data?.message || "Failed to update profile";
      }
    },
    null
  );

  const [passwordError, passwordAction, isPasswordPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        if (hasPassword) {
          await userService.changePassword({
            currentPassword: formData.get("currentPassword") as string,
            newPassword: formData.get("newPassword") as string,
          });
        } else {
          await userService.setPassword({
            newPassword: formData.get("newPassword") as string,
          });
        }
        return null;
      } catch (err: any) {
        return err.response?.data?.message || "Failed to update password";
      }
    },
    null
  );

  const [addressError, addAddressAction, isAddingAddress] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await userService.addAddress({
          line1: formData.get("line1") as string,
          line2: (formData.get("line2") as string) || undefined,
          city: formData.get("city") as string,
          state: (formData.get("state") as string) || undefined,
          postalCode: formData.get("postalCode") as string,
          country: formData.get("country") as string,
          isDefault: formData.get("isDefault") === "on",
        });
        await refetchAddresses();
        setShowAddressForm(false);
        return null;
      } catch (err: any) {
        return err.response?.data?.message || "Failed to add address";
      }
    },
    null
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-medium text-gray-900 mb-6">My profile</h1>

      {/* tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {(["profile", "addresses", "password"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* profile tab */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xl font-medium text-blue-600">
                  {user?.email?.[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name || "No name set"}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              {isGoogleUser && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                  Google account
                </span>
              )}
            </div>
          </div>

          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {profileError}
            </div>
          )}

          <form action={profileAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
              <input
                name="name"
                defaultValue={user?.name || ""}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProfilePending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isProfilePending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* addresses tab */}
      {activeTab === "addresses" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Saved addresses</h2>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showAddressForm ? "Cancel" : "+ Add new"}
            </button>
          </div>

          {showAddressForm && (
            <form action={addAddressAction} className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
              {addressError && (
                <p className="text-sm text-red-600">{addressError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address line 1</label>
                  <input
                    name="line1"
                    required
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address line 2 (optional)</label>
                  <input
                    name="line2"
                    placeholder="Apartment, suite, etc."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input
                    name="city"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input
                    name="state"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Postal code</label>
                  <input
                    name="postalCode"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                  <input
                    name="country"
                    required
                    defaultValue="India"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isDefault" className="rounded" />
                    <span className="text-sm text-gray-600">Set as default</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isAddingAddress}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isAddingAddress ? "Saving..." : "Save address"}
              </button>
            </form>
          )}

          {addresses.length === 0 && !showAddressForm ? (
            <p className="text-sm text-gray-400">No addresses saved yet.</p>
          ) : (
            <div className="space-y-2">
              {addresses.map((address) => (
                <div key={address.id} className="p-3 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{address.line1}</p>
                      {address.line2 && <p className="text-xs text-gray-500">{address.line2}</p>}
                      <p className="text-xs text-gray-500">
                        {address.city}{address.state && `, ${address.state}`} — {address.postalCode}
                      </p>
                      <p className="text-xs text-gray-500">{address.country}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {address.isDefault && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete this address?")) deleteAddress(address.id);
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* password tab */}
      {activeTab === "password" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">
            {hasPassword ? "Change password" : "Set password"}
          </h2>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {passwordError}
            </div>
          )}

          <form action={passwordAction} className="space-y-4">
            {hasPassword && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current password</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
              <input
                type="password"
                name="newPassword"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPasswordPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isPasswordPending ? "Saving..." : hasPassword ? "Change password" : "Set password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;