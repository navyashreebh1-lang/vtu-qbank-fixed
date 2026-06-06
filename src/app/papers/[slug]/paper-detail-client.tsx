"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Eye, ZoomIn, ZoomOut, Maximize2, ArrowLeft, Flag, Calendar, Tag, BookOpen, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatNumber, getSemesterLabel, getBranchColor, formatDate } from "@/lib/utils";
import type { QuestionPaper } from "@/types";
import Link from "next/link";
import { motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PaperDetailClientProps {
  paper: QuestionPaper;
}

export function PaperDetailClient({ paper }: PaperDetailClientProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [numPages, setNumPages] = useState<number>();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width - 32); // Account for padding
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setPdfError(error.message);
  }

  // Track view
  useEffect(() => {
    fetch(`/api/papers/${paper.id}/view`, { method: "POST" }).catch(() => {});
  }, [paper.id]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/papers/${paper.id}/download`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.data.pdfUrl, "_blank");
      }
    } catch {
      // fallback
      window.open(paper.pdfUrl, "_blank");
    }
  };

  const handleReport = async () => {
    if (reportReason.length < 10) return;
    setIsReporting(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id, reason: reportReason }),
      });
      setReportSent(true);
      setReportReason("");
    } catch {
      // ignore
    } finally {
      setIsReporting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/papers">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Papers
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Viewer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              {/* Viewer toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-border/50 bg-card/80">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 rounded-full"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>

              {/* PDF embed */}
              <div 
                ref={containerRef}
                className="relative bg-muted/30 overflow-auto flex flex-col items-center py-8" 
                style={{ height: "75vh" }}
              >
                {pdfError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <FileText className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
                    <p className="text-destructive font-medium mb-2">Failed to load PDF</p>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md">{pdfError}</p>
                    <Button className="gap-2 rounded-full" onClick={() => window.open(paper.pdfUrl, "_blank")}>
                      <Download className="h-4 w-4" />
                      Open PDF in New Tab
                    </Button>
                  </div>
                ) : paper.pdfUrl ? (
                  <Document
                    file={paper.pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading PDF Document...</p>
                      </div>
                    }
                    className="flex flex-col items-center gap-6"
                  >
                    {Array.from(new Array(numPages || 0), (el, index) => (
                      <div key={`page_${index + 1}`} className="shadow-lg border border-border/20 bg-white max-w-full">
                         <Page
                           pageNumber={index + 1}
                           width={containerWidth ? Math.min(containerWidth, 800) : undefined}
                           scale={zoom / 100}
                           renderTextLayer={true}
                           renderAnnotationLayer={true}
                           className="max-w-full"
                         />
                      </div>
                    ))}
                  </Document>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        PDF preview not available
                      </p>
                      <Button
                        className="mt-4 gap-2 rounded-full"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Paper Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Title & Badges */}
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant="outline"
                  className={cn("font-medium", getBranchColor(paper.branch))}
                >
                  {paper.branch}
                </Badge>
              </div>
              <h1 className="text-xl font-bold mb-2">{paper.title}</h1>
              <p className="text-sm text-muted-foreground mb-4">
                {paper.subjectName}
              </p>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Semester
                  </span>
                  <span className="font-medium">
                    {getSemesterLabel(paper.semester)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Uploaded on
                  </span>
                  <span className="font-medium">
                    {formatDate(paper.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Downloads
                  </span>
                  <span className="font-medium">
                    {formatNumber(paper.downloads)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Views
                  </span>
                  <span className="font-medium">
                    {formatNumber(paper.views)}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {paper.tags && paper.tags.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {paper.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-muted-foreground text-center mt-2">
                Uploaded {formatDate(paper.createdAt)}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full gap-2 rounded-xl h-11"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>

              <Dialog>
                <DialogTrigger render={
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 text-muted-foreground"
                  >
                    <Flag className="h-4 w-4" />
                    Report Paper
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report this paper</DialogTitle>
                  </DialogHeader>
                  {reportSent ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Thank you for your report. We&apos;ll review it shortly.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Please describe the issue with this paper..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button
                        onClick={handleReport}
                        disabled={reportReason.length < 10 || isReporting}
                        className="w-full"
                      >
                        {isReporting ? "Submitting..." : "Submit Report"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
