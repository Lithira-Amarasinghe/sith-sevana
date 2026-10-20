import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const previewHost = "29337e014340c950dd34-pod-63rtgxig4nghnmykoektythmoi-5173.us6p.cursorvm.com";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [previewHost, ".cursorvm.com"],
  },
});
