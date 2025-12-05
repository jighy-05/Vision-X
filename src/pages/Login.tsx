import React from "react";
import LoginForm from "@/components/Loginform";

const Login: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* LEFT 2/3 — VIDEO SECTION */}
      <div className="hidden md:block md:w-2/3 relative">
        <video
          className="w-full h-full object-cover"
          src="/Earth.mp4" // file should be at: public/Earth.mp4
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Optional dark gradient over video for better contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-transparent" />

        {/* Favicon overlay in top-left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-5 left-5 z-30"
        >
          <img
            src="/favicon1.png"
            alt="favicon"
            className="w-32 h-32 rounded-lg shadow-xl"
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>

      {/* RIGHT 1/3 — LOGIN FORM SECTION */}
      <div className="w-full md:w-1/3 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;