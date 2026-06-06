"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Upload,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, getSemesterLabel, formatDate, getBranchColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { QuestionPaper } from "@/types";
import Link from "next/link";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StatsData {
  totalPapers: number;
  totalDownloads: number;
  totalViews: number;
  totalUploads: number;
  recentUploads: QuestionPaper[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminSecret, setAdminSecret] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics?detailed=true");
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (paperId: string) => {
    if (!adminSecret) {
      setDeleteError("Admin secret is required.");
      return;
    }

    setDeletingId(paperId);
    setDeleteError("");

    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: "DELETE",
        headers: {
          "x-admin-secret": adminSecret,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete paper");
      }

      // Update UI state
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalPapers: Math.max(0, prev.totalPapers - 1),
          recentUploads: prev.recentUploads.filter((p) => p.id !== paperId),
        };
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeletingId(null);
    }
  };

  const statCards = [
    {
      title: "Total Papers",
      value: stats?.totalPapers || 0,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Downloads",
      value: stats?.totalDownloads || 0,
      icon: Download,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Total Views",
      value: stats?.totalViews || 0,
      icon: Eye,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Uploads",
      value: stats?.totalUploads || 0,
      icon: Upload,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of VTU Question Bank
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {formatNumber(stat.value)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      stat.bg
                    )}
                  >
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Uploads */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Uploads</CardTitle>
          <Link href="/papers?sort=newest">
            <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
              View All <ArrowUpRight className="h-3 w-3" />
            </Badge>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentUploads && stats.recentUploads.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUploads.slice(0, 5).map((paper) => (
                <Link
                  key={paper.id}
                  href={`/papers/${paper.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {paper.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {paper.subjectName} • {paper.branch} • {getSemesterLabel(paper.semester)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground mr-4">
                    {formatDate(paper.createdAt)}
                  </span>
                  
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteError("");
                          }}
                        >
                          {deletingId === paper.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      }
                    />
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the paper
                          <strong> {paper.title}</strong> from our servers and Cloudinary.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="secret" className="text-sm font-medium">
                          Admin Secret required to confirm
                        </Label>
                        <Input
                          id="secret"
                          type="password"
                          placeholder="Enter ADMIN_SECRET"
                          className="mt-1.5"
                          value={adminSecret}
                          onChange={(e) => setAdminSecret(e.target.value)}
                        />
                        {deleteError && (
                          <p className="text-sm text-destructive mt-2">{deleteError}</p>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={(e) => {
                            if (!adminSecret) {
                              e.preventDefault();
                              setDeleteError("Admin secret is required");
                            } else {
                              handleDelete(paper.id);
                            }
                          }}
                          disabled={deletingId === paper.id}
                        >
                          {deletingId === paper.id ? "Deleting..." : "Delete Paper"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No papers uploaded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
