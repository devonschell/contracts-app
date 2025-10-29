"use client";

import { ReactNode } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";

export default function PageContainer({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Actions + Clerk Avatar */}
        <div className="flex items-center gap-3">
          {actions}
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
