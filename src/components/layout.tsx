import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-4xl h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
        <div className="h-1 w-full bg-primary/20 absolute top-0 left-0">
           <div className="h-full bg-primary animate-pulse w-1/3"></div>
        </div>
        <div className="flex-1 p-6 sm:p-8 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
