"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";

export function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            CertNAI
          </span>
          <span className="text-xs text-[var(--muted)] hidden sm:inline">
            Sports Predictions
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-white transition"
          >
            Games
          </Link>
          <Link
            href="/predictions"
            className="text-sm text-[var(--muted)] hover:text-white transition"
          >
            My Predictions
          </Link>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
