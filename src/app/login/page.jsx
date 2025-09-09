"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      // Set cookie for middleware
      document.cookie = `sb-access-token=${data.session.access_token}; path=/;`;
      router.push("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transform hover:scale-105 transition-transform duration-300"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Welcome Back
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
        )}

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-xl focus:ring-2 focus:ring-pink-400 focus:outline-none transition"
            required
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-xl focus:ring-2 focus:ring-pink-400 focus:outline-none transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-pink-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
        >
          Login
        </button>

        <p className="mt-5 text-center text-gray-500 text-sm">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-pink-600 font-semibold hover:text-pink-800 transition-colors"
          >
            Signup
          </a>
        </p>
      </form>
    </div>
  );
}
