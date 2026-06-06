import { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/landing/footer";
import { UploadFormClient } from "./upload-client";

export const metadata: Metadata = {
  title: "Upload Question Paper",
  description:
    "Upload VTU question papers to help fellow students. Support all branches and semesters.",
};

export default function UploadPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-8 md:pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Upload Question Paper
            </h1>
            <p className="text-muted-foreground">
              Share question papers with fellow VTU students. Your contribution
              helps everyone!
            </p>
          </div>

          <UploadFormClient />
        </div>
      </div>
      <Footer />
    </main>
  );
}
