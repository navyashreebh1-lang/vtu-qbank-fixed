"use client";

import { PaperCard } from "./paper-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX } from "lucide-react";
import type { QuestionPaper } from "@/types";

interface PaperGridProps {
  papers: QuestionPaper[];
  isLoading?: boolean;
}

export function PaperGrid({ papers, isLoading }: PaperGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-5 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-32" />
            <div className="flex justify-between pt-3 border-t border-border/50">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No papers found</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Try adjusting your search query or filters to find what you&apos;re looking
          for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {papers.map((paper, index) => (
        <PaperCard key={paper.id} paper={paper} index={index} />
      ))}
    </div>
  );
}
