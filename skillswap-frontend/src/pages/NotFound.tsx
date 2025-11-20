// src/pages/NotFound.tsx
import React from "react";
import MobileShell from "../components/MobileShell";

export default function NotFound() {
  return (
    <MobileShell title="Not Found" showBack={true}>
      <div className="p-4 text-center">
        <h1 className="text-2xl font-semibold">404 — Page not found</h1>
      </div>
    </MobileShell>
  );
}
