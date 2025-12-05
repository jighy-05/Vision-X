import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Phone } from "lucide-react";

const LoginForm = () => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const navigate = useNavigate();

  const goToApp = () => navigate("/app");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      if (email && password) goToApp();
      return;
    }

    if (
      email &&
      password &&
      confirmPassword &&
      firstName &&
      agreeTerms &&
      password === confirmPassword
    ) {
      goToApp();
    }
  };

  const handleSocialContinue = (provider: string) => {
    console.log(`Continue with ${provider}`);
    goToApp();
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <Card className="w-full max-w-md bg-[#11121A]/95 border border-white/15 shadow-2xl rounded-3xl">
      <CardHeader className="pb-4 space-y-2">
        <CardTitle className="text-2xl md:text-3xl font-semibold text-white">
          {mode === "signup" ? "Create an account" : "Welcome back"}
        </CardTitle>

        <CardDescription className="text-sm text-slate-300">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-[#3B82F6] hover:underline"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-[#3B82F6] hover:underline"
              >
                Sign up
              </button>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-slate-300">
                  First name
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="bg-[#181927] border-transparent focus-visible:ring-[#3B82F6] text-sm text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-slate-300">
                  Last name
                </Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="bg-[#181927] border-transparent focus-visible:ring-[#3B82F6] text-sm text-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-300">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#181927] border-transparent focus-visible:ring-[#3B82F6] text-sm text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-300">
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-[#181927] border-transparent focus-visible:ring-[#3B82F6] text-sm text-white"
              required
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-300">
                Confirm password
              </Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="bg-[#181927] border-transparent focus-visible:ring-[#3B82F6] text-sm text-white"
                required
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="flex items-start gap-2 text-xs text-slate-300">
              <Checkbox
                checked={agreeTerms}
                onCheckedChange={(val) => setAgreeTerms(val === true)}
                className="mt-[2px] border-slate-500 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                required
              />
              <Label className="font-normal">
                I agree to the{" "}
                <button className="text-[#3B82F6] hover:underline">
                  terms &amp; conditions
                </button>
              </Label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-sm font-semibold mt-1"
          >
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>

          {/* ⭐ NEW — GUEST LOGIN BUTTON */}
          <Button
            type="button"
            onClick={goToApp}
            className="w-full h-10 rounded-xl bg-black/40 border border-white/20 text-white hover:bg-black/60 text-sm font-medium"
          >
            Guest Login
          </Button>
        </form>

        {/* Social SSO */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Separator className="hidden md:block bg-slate-700 flex-1" />
            <span className="text-xs text-slate-400 whitespace-nowrap">
              Or register with
            </span>
            <Separator className="hidden md:block bg-slate-700 flex-1" />
          </div>

          <div className="space-y-2.5">
            <Button
              variant="outline"
              className="w-full h-10 rounded-full bg-transparent border-slate-700 hover:bg-slate-800/60 text-white text-sm font-normal justify-start gap-3"
              onClick={() => handleSocialContinue("Google")}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                G
              </span>
              <span>Continue with Google</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-10 rounded-full bg-transparent border-slate-700 hover:bg-slate-800/60 text-white text-sm font-normal justify-start gap-3"
              onClick={() => handleSocialContinue("Apple")}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
                
              </span>
              <span>Continue with Apple</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;