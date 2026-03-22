"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, ImageIcon, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, type ReportAnalysis } from "@/lib/api";

interface UploadedFile {
  file: File;
  id: string;
  status: "uploading" | "analyzing" | "completed" | "error";
  progress: number;
  analysis?: ReportAnalysis;
  error?: string;
}

export function ReportUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = "";
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType = file.type === "application/pdf" || file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      console.warn("Some files were rejected. Only PDF and image files under 10MB are allowed.");
    }

    for (const file of validFiles) {
      const uploadedFile: UploadedFile = {
        file,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: "uploading",
        progress: 0,
      };

      setUploadedFiles((prev) => [...prev, uploadedFile]);
      await processFile(uploadedFile);
    }
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      for (let progress = 0; progress <= 100; progress += 20) {
        setUploadedFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f)));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "analyzing", progress: 100 } : f))
      );

      const analysis = await api.uploadReport(uploadedFile.file);

      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "completed", analysis } : f))
      );
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "analyzing":
        return <Loader2 className="h-4 w-4 animate-spin text-medical-blue" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-medical-green" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "analyzing":
        return "Analyzing report...";
      case "completed":
        return "Analysis complete";
      case "error":
        return "Upload failed";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-medical-blue/30 bg-medical-blue/5">
        <CardContent className="p-8">
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${
                isDragOver
                  ? "border-medical-blue bg-medical-blue/10"
                  : "border-medical-gray hover:border-medical-blue/50"
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-medical-blue/10 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-medical-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Upload Medical Reports</h3>
                <p className="text-muted-foreground mt-1">
                  Drag and drop your medical reports here, or click to browse
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue">
                  <FileText className="h-3 w-3 mr-1" />
                  PDF Reports
                </Badge>
                <Badge variant="secondary" className="bg-medical-green/10 text-medical-green">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Medical Images
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Maximum file size: 10MB. Supported formats: PDF, JPG, PNG</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-medical-blue" />
              Uploaded Reports ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-shrink-0">{getFileIcon(uploadedFile.file)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(uploadedFile.status)}
                      <span className="text-xs text-muted-foreground">{getStatusText(uploadedFile.status)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    {(uploadedFile.status === "uploading" || uploadedFile.status === "analyzing") && (
                      <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                    )}
                  </div>
                </div>

                {uploadedFile.status === "completed" && uploadedFile.analysis && (
                  <Alert className="border-medical-green/20 bg-medical-green/5">
                    <CheckCircle className="h-4 w-4 text-medical-green" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium text-medical-green">Analysis Complete</p>
                        <div className="markdown-container text-sm text-foreground bg-background/50 p-3 rounded border">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {uploadedFile.analysis.analysis}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFile.status === "error" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {uploadedFile.error || "Failed to process the file. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-medical-purple/5 border-medical-purple/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-medical-purple mb-3">How Report Analysis Works</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Upload your medical reports in PDF or image format</p>
            <p>• Our AI analyzes the content and extracts key medical information</p>
            <p>• Get insights about diseases, symptoms, treatments, and precautions</p>
            <p>• All data is processed securely and not stored permanently</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}