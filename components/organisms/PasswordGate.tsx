"use client";
import { useState } from "react";

interface PasswordGateProps {
  onSuccess: () => void;
}

export function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem("quinta_password_verified", "true");
        onSuccess();
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          className="w-full bg-transparent border-2 border-white text-white text-center text-2xl py-4 px-6 focus:outline-none focus:border-gray-400 transition-colors"
          placeholder="PASSWORD"
          autoFocus
          disabled={loading}
        />

        {error && (
          <p className="text-white text-center mt-4 text-sm tracking-wider">
            INCORRECT
          </p>
        )}
      </form>
    </div>
  );
}
