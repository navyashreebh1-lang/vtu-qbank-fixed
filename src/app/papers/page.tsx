import { Suspense } from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/landing/footer";
import { BrowsePapersClient } from "./browse-client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Browse Question Papers",
  description:
    "Browse and search VTU question papers from all branches and semesters. Filter by branch, semester, subject, and more.",
};

export const dynamic = "force-dynamic";

export default async function BrowsePapersPage() {
  let subjects: string[] = [];
  try {
    const subjectsResult = await prisma.questionPaper.findMany({
      where: { status: "approved" },
      select: { subjectName: true },
      distinct: ["subjectName"],
    });
    subjects = subjectsResult
      .map((s) => s.subjectName)
      .filter(Boolean)
      .sort();
  } catch (error) {
    console.error("Failed to fetch subjects from database:", error);
    // Fallback to empty subjects array to prevent build crashes
    subjects = [];
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-8 md:pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Browse Papers
            </h1>
            <p className="text-muted-foreground">
              Find the question paper you need from our extensive collection.
            </p>
          </div>

          <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
            <BrowsePapersClient subjects={subjects} />
          </Suspense>
        </div>
      </div>
      <Footer />
    </main>
  );
}
