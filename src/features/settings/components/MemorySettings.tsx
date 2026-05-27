import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export function MemorySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Memory & Indexing
        </CardTitle>
        <CardDescription>
          Document indexing and memory management
        </CardDescription>
      </CardHeader>
      <CardContent className="py-12 text-center">
        <div className="text-muted-foreground">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p>Memory and indexing features are currently in development.</p>
        </div>
      </CardContent>
    </Card>
  );
}