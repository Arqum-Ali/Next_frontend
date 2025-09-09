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
       const isMobile = /Mobi|Android/i.test(navigator.userAgent);
       const constraints = {
         video: isMobile
           ? { facingMode: "environment", width: 640, height: 480 }
           : { width: 1280, height: 720 },
       };

       const mediaStream = await navigator.mediaDevices.getUserMedia(
         constraints
       );
       setStream(mediaStream);

       if (videoRef.current) {
         videoRef.current.srcObject = mediaStream;

         // Wait for video to load metadata (dimensions)
         videoRef.current.onloadedmetadata = () => {
           canvasRef.current.width = videoRef.current.videoWidth;
           canvasRef.current.height = videoRef.current.videoHeight;

           // Start capture only after video is ready
           const id = setInterval(() => {
             if (videoRef.current.readyState >= 2) captureImage();
           }, 5000);
           setIntervalId(id);
         };

       }
     } catch (err) {
       console.error("Camera error:", err);
     }
   }

   initCamera();

   return () => stopCapture();
 }, []);


  const stopCapture = () => {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    console.log("🛑 Capture stopped.");
  };

  const captureImage = async (isMobile) => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Adjust canvas size for mobile/laptop
    canvasRef.current.width = isMobile ? 640 : 1280;
    canvasRef.current.height = isMobile ? 480 : 720;

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;

      // Preview flash
      const imageUrl = URL.createObjectURL(blob);
      setPreview(imageUrl);
      setTimeout(() => setPreview(null), 1000);

      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      const fileName = `capture-${Date.now()}.png`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("captures")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error("❌ Supabase upload failed:", uploadError);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("captures")
        .getPublicUrl(fileName);

      console.log("✅ File URL:", publicUrl.publicUrl);

      // Get geolocation (works on HTTPS/mobile)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { error: insertError } = await supabase
              .from("captures_metadata")
              .insert({
                image_url: publicUrl.publicUrl,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                created_at: new Date().toISOString(),
              });

            if (insertError) console.error("❌ Metadata insert failed:", insertError);
            else console.log("✅ Metadata saved!");
          },
          (err) => console.error("❌ Geolocation failed:", err),
          { enableHighAccuracy: true, timeout: 2500 }
        );
      } else {
        console.warn("⚠️ Geolocation not supported.");
      }
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

      <canvas ref={canvasRef} className="hidden" />

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

      <button
        onClick={stopCapture}
        className="absolute top-4 left-4 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg"
      >
        Stop Capture
      </button>
    </div>
  );
}
