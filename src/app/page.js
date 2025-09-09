"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Page() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [flash, setFlash] = useState(false);
  const [preview, setPreview] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    async function initCamera() {
      try {
        const isMobile =
          typeof navigator !== "undefined" &&
          /Mobi|Android/i.test(navigator.userAgent);

        const constraints = {
          video: isMobile
            ? { facingMode: { exact: "environment" } }
            : true,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        const id = setInterval(() => {
          captureImage();
        }, 5000);

        setIntervalId(id);
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    initCamera();

    return () => {
      stopCapture();
    };
  }, []);

  const stopCapture = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    console.log("🛑 Capture stopped.");
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;

      const imageUrl = URL.createObjectURL(blob);
      setPreview(imageUrl);
      setTimeout(() => setPreview(null), 1000);

      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      const fileName = `capture-${Date.now()}.png`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("captures")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Supabase upload failed:", uploadError);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("captures")
        .getPublicUrl(fileName);

      console.log("✅ File URL:", publicUrl.publicUrl);

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { error: insertError } = await supabase
          .from("captures_metadata")
          .insert({
            image_url: publicUrl.publicUrl,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("❌ Insert failed:", insertError);
        } else {
          console.log("✅ Metadata saved!");
        }
      });
    }, "image/png");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      <canvas ref={canvasRef} width={1280} height={720} className="hidden" />

      {flash && (
        <div className="absolute inset-0 bg-white opacity-80 animate-pulse" />
      )}

      {preview && (
        <img
          src={preview}
          alt="Captured"
          className="absolute bottom-4 right-4 w-32 h-20 rounded-lg border-2 border-white shadow-lg"
        />
      )}

      {/* Stop Button */}
      <button
        onClick={stopCapture}
        className="absolute top-4 left-4 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg"
      >
        Stop Capture
      </button>
    </div>
  );
}
