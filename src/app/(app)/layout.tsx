"use client";

import * as React from "react";
import { AppProvider } from "@/providers/app-provider";
import { AppSidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { ComposerModal } from "@/components/app/composer";
import { CommandPalette } from "@/components/app/command-palette";
import { UpgradeModal } from "@/components/app/upgrade-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <AppProvider>
      <div className="min-h-screen bg-ink-950 comb-dark">
        {/* ambient honey glow */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(600px 400px at 12% 0%, rgba(245,163,1,0.10), transparent 60%), radial-gradient(500px 380px at 100% 100%, rgba(245,163,1,0.07), transparent 60%)",
          }}
        />
        <AppSidebar menuOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />
        <div className="relative lg:pl-[272px]">
          {/* No top padding: the panel starts flush with the viewport so the
              sticky header pins to y=0 with no dark gap above it. */}
          <main className="min-h-screen px-0 py-0 lg:px-3">
            <div className="min-h-screen bg-cream-100 lg:rounded-t-[28px] lg:border-x lg:border-t lg:border-ink-800/80 shadow-[var(--shadow-lift)]">
              <Topbar onMenu={() => setMenuOpen(true)} />
              <div className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</div>
            </div>
          </main>
        </div>
        <ComposerModal />
        <CommandPalette />
        <UpgradeModal />
      </div>
    </AppProvider>
  );
}
