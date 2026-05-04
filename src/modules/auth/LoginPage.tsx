import { useState, type FormEvent } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
            <Target className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl italic">MEZZOBET ADMIN</h1>
            <p className="text-zinc-400 text-sm">Super admin, agent, shop owner only</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-zinc-900 border-zinc-700 text-white h-11" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="bg-zinc-900 border-zinc-700 text-white h-11" />
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <Button disabled={isLoading} className="w-full bg-brand text-black hover:bg-brand/80 h-11 font-bold">
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
