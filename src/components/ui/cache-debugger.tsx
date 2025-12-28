"use client";

import { useState } from "react";
import { useCache } from "@/hooks/use-cache";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Trash2, RefreshCw, Database, Zap, TrendingUp, Clock, HardDrive } from "lucide-react";

interface CacheDebuggerProps {
  namespace?: string;
  showDetailed?: boolean;
}

export function CacheDebugger({ namespace = "debug", showDetailed = false }: CacheDebuggerProps) {
  const cache = useCache({ namespace, debug: true });
  const [expanded, setExpanded] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return "text-green-600";
    if (rate >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const handleExportCache = () => {
    const entries = cache.keys().map(key => ({
      key,
      hasValue: cache.has(key),
      timestamp: Date.now(),
    }));

    const data = {
      namespace,
      stats: cache.stats,
      entries,
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cache-${namespace}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCache = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Implementation would depend on your cache structure
        console.log("Imported cache data:", data);
      } catch (error) {
        console.error("Failed to import cache:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-lg">Cache Debug Panel</CardTitle>
            <Badge variant="outline">{namespace}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        <CardDescription>
          Real-time cache statistics and management tools
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Hit Rate</span>
            </div>
            <p className={`text-2xl font-bold ${getHitRateColor(cache.stats.hitRate)}`}>
              {(cache.stats.hitRate * 100).toFixed(1)}%
            </p>
            <Progress value={cache.stats.hitRate * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Hits</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(cache.stats.hits)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(cache.stats.misses)} misses
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Entries</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatNumber(cache.stats.entries)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(cache.stats.size)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Evictions</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatNumber(cache.stats.evictions)}
            </p>
            <p className="text-xs text-muted-foreground">
              Auto-cleaned
            </p>
          </div>
        </div>

        <Separator />

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cache.cleanup()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cache.clear()}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCache}
          >
            Export Cache
          </Button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportCache}
              className="hidden"
              id="import-cache"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("import-cache")?.click()}
            >
              Import Cache
            </Button>
          </div>
        </div>

        {/* Detailed Information */}
        {expanded && showDetailed && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Cache Keys</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {cache.keys().length === 0 ? (
                    <p className="text-sm text-muted-foreground">No entries in cache</p>
                  ) : (
                    cache.keys().map(key => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <span className="font-mono text-xs truncate flex-1">{key}</span>
                        <Badge variant={cache.has(key) ? "default" : "secondary"} className="ml-2">
                          {cache.has(key) ? "Valid" : "Expired"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Raw Statistics</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(cache.stats, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Excellent</p>
            <p className="text-lg font-bold text-green-700">Hit Rate &gt; 80%</p>
            <p className="text-xs text-green-600">Cache is performing well</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium">Good</p>
            <p className="text-lg font-bold text-yellow-700">Hit Rate 50-80%</p>
            <p className="text-xs text-yellow-600">Cache is acceptable</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium">Poor</p>
            <p className="text-lg font-bold text-red-700">Hit Rate &lt; 50%</p>
            <p className="text-xs text-red-600">Cache needs optimization</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}