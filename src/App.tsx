import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

const App = () => {
  return (
    <Routes>
      {/* Login screen */}
      <Route path="/" element={<Login />} />

      {/* Main EO console (tabs + ChatPanel etc.) */}
      <Route path="/app" element={<Index />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;