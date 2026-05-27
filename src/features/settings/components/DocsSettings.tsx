import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";

export function DocsSettings() {
  const handleDocsClick = () => {
    window.open("https://oyren.ai/docs", "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Documentation
        </CardTitle>
        <CardDescription>
          Access OyrenAI documentation and guides
        </CardDescription>
      </CardHeader>
      <CardContent className="py-12 text-center">
        <div>
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">Documentation</h3>
          <p className="text-muted-foreground mb-6">
            Access comprehensive guides, tutorials, and API documentation.
          </p>
          <Button onClick={handleDocsClick} className="inline-flex items-center gap-2">
            Open Documentation
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}