"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BRANCHES, SEMESTERS } from "@/lib/constants";
import { useDebounce } from "@/hooks";
import { cn } from "@/lib/utils";

interface FiltersState {
  search: string;
  branch: string;
  semester: string;
  subject: string;
  sort: string;
}

export function PaperFilters({ subjects = [] }: { subjects?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersState>({
    search: searchParams.get("search") || "",
    branch: searchParams.get("branch") || "",
    semester: searchParams.get("semester") || "",
    subject: searchParams.get("subject") || "",
    sort: searchParams.get("sort") || "newest",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const updateUrl = useCallback(
    (newFilters: FiltersState) => {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "newest" && key !== "search") {
          params.set(key, value);
        }
      });
      if (newFilters.sort && newFilters.sort !== "newest") {
        params.set("sort", newFilters.sort);
      }
      if (newFilters.search) {
        params.set("search", newFilters.search);
      }
      router.push(`/papers?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const newFilters = { ...filters, search: debouncedSearch };
    updateUrl(newFilters);
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (key !== "search") {
      updateUrl(newFilters);
    }
  };

  const clearFilters = () => {
    const cleared: FiltersState = {
      search: "",
      branch: "",
      semester: "",
      subject: "",
      sort: "newest",
    };
    setFilters(cleared);
    router.push("/papers");
  };

  const activeFilterCount = [
    filters.branch,
    filters.semester,
    filters.subject,
  ].filter(Boolean).length;

  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Branch
        </label>
        <Select
          value={filters.branch || undefined}
          onValueChange={(v) => handleFilterChange("branch", v || "")}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            {BRANCHES.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label} - {b.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Semester
        </label>
        <Select
          value={filters.semester || undefined}
          onValueChange={(v) => handleFilterChange("semester", v || "")}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            {SEMESTERS.map((s) => (
              <SelectItem key={s.value} value={s.value.toString()}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subjects.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Subject
          </label>
          <Select
            value={filters.subject || undefined}
            onValueChange={(v) => handleFilterChange("subject", v || "")}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-destructive"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search + Sort + Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers... (e.g., '4th sem ADA paper')"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card/80 border-border/50"
          />
          {filters.search && (
            <button
              onClick={() => handleFilterChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Select
            value={filters.sort}
            onValueChange={(v) => handleFilterChange("sort", v || "newest")}
          >
            <SelectTrigger className="flex-1 sm:w-[160px] h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most_downloaded">Most Downloaded</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filter button */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="lg:hidden h-11 rounded-xl gap-2 shrink-0"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge className="h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              }
            />
            <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls />
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.branch && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => handleFilterChange("branch", "")}
            >
              {filters.branch}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.semester && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => handleFilterChange("semester", "")}
            >
              Sem {filters.semester}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.subject && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => handleFilterChange("subject", "")}
            >
              {filters.subject}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Desktop sidebar filters */}
      <div className="hidden lg:block">
        <div className="p-5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </h3>
          <FilterControls />
        </div>
      </div>
    </div>
  );
}
