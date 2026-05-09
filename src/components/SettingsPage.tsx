import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          Settings <span className="text-brand">Control</span>
        </h1>
        <p className="text-zinc-400">Operational configuration is managed in Data Fetch and Results Sync.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System</span>
            <Badge className="bg-zinc-700">ADMIN</Badge>
          </CardTitle>
          <CardDescription>Use these modules to configure external ingestion and settlement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Link to="/data-fetching" className="block text-brand hover:text-white underline underline-offset-4">
            Data Fetch (Odds/Catalog/Results controls)
          </Link>
          <Link to="/results" className="block text-brand hover:text-white underline underline-offset-4">
            Results Sync (Cashbox token + sync)
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

