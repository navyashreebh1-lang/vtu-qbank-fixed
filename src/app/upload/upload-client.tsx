"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BRANCHES, SEMESTERS, MAX_FILE_SIZE } from "@/lib/constants";
import type { UploadFormValues } from "@/lib/validators";

type FormState = "idle" | "uploading" | "submitting" | "success" | "error";

export function UploadFormClient() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [cloudinaryId, setCloudinaryId] = useState("");

  const [formData, setFormData] = useState<Partial<UploadFormValues>>({
    title: "",
    subjectName: "",
    branch: undefined,
    semester: undefined,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;

    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB.");
      return;
    }

    setFile(f);
    setError("");
    setFormState("uploading");
    setProgress(0);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const uploadData = new FormData();
      uploadData.append("file", f);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        let errorMessage = "Upload failed";
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setPdfUrl(data.data.pdfUrl);
      setCloudinaryId(data.data.cloudinaryId);
      setProgress(100);
      setFormState("idle");
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setFormState("error");
      setFile(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfUrl) {
      setError("Please upload a file first.");
      return;
    }

    if (
      !formData.title ||
      !formData.subjectName ||
      !formData.branch ||
      !formData.semester
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setFormState("submitting");
    setError("");

    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pdfUrl,
          cloudinaryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit paper");
      }

      setFormState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setFormState("error");
    }
  };

  const removeFile = () => {
    setFile(null);
    setPdfUrl("");
    setCloudinaryId("");
    setProgress(0);
    setFormState("idle");
  };

  if (formState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Paper Uploaded Successfully!</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Your paper has been submitted and is pending review. Once approved,
          it will be visible to all students.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setFormState("idle");
              setFile(null);
              setPdfUrl("");
              setCloudinaryId("");
              setFormData({
                title: "",
                subjectName: "",
                branch: undefined,
                semester: undefined,
              });
            }}
          >
            Upload Another
          </Button>
          <Button className="rounded-full" onClick={() => {
            router.refresh();
            router.push("/papers");
          }}>
            Browse Papers
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Dropzone */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <Label className="text-sm font-medium mb-3 block">
          File (PDF only) <span className="text-destructive">*</span>
        </Label>

        {file && pdfUrl ? (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={removeFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-6 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/50 hover:bg-primary/[0.02]"
            }`}
          >
            <input {...getInputProps()} />

            {formState === "uploading" ? (
              <div className="space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Uploading... {progress}%
                </p>
                <Progress value={progress} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm font-medium mb-1">
                  {isDragActive
                    ? "Drop your file here..."
                    : "Drag & drop your file here"}
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse • PDF only • Max 10MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Paper Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1.5 block">
              Paper Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g., DBMS Module Wise Questions"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="h-10"
            />
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">
              Subject Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g., Database Management System"
              value={formData.subjectName}
              onChange={(e) =>
                setFormData({ ...formData, subjectName: e.target.value })
              }
              className="h-10"
            />
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">
              Branch <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.branch}
              onValueChange={(v) =>
                setFormData({ ...formData, branch: (v as UploadFormValues["branch"]) || undefined })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Branch" />
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
            <Label className="text-sm mb-1.5 block">
              Semester <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.semester?.toString()}
              onValueChange={(v) =>
                setFormData({ ...formData, semester: v ? parseInt(v) : undefined })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Semester" />
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

        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-medium gap-2"
        disabled={formState === "submitting" || formState === "uploading"}
      >
        {formState === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Submit Paper
          </>
        )}
      </Button>
    </motion.form>
  );
}
