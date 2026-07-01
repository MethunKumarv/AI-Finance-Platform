"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, Loader2, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export function ReceiptUpload({ onExtract, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload and extract
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process receipt");
      }

      const data = await response.json();
      setExtracted(data);
      toast.success("Receipt processed successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to process receipt");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  if (extracted) {
    return (
      <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Extracted Data
          </h3>
          <button onClick={() => {
            setExtracted(null);
            setPreview(null);
          }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {preview && (
          <img src={preview} alt="Receipt preview" className="w-full h-32 object-cover rounded" />
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Amount</p>
            <p className="font-semibold text-lg">${extracted.amount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Merchant</p>
            <p className="font-semibold">{extracted.merchant}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date</p>
            <p className="font-semibold">{extracted.date}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Category</p>
            <p className="font-semibold capitalize">{extracted.category}</p>
          </div>
          {extracted.description && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Description</p>
              <p className="font-semibold">{extracted.description}</p>
            </div>
          )}
        </div>

        <Button
          onClick={() => {
            onExtract(extracted);
            onClose();
          }}
          className="w-full"
        >
          Use This Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-blue-50">
        <Camera className="w-8 h-8 mx-auto text-blue-600 mb-2" />
        <p className="font-semibold text-sm mb-1">Upload Receipt</p>
        <p className="text-xs text-muted-foreground mb-3">
          We'll automatically extract the amount, date, and category
        </p>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          disabled={uploading}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
