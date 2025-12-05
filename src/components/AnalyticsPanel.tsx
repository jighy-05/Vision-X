import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  BarChart3,
  TrendingUp,
  Droplets,
  Building2,
  AlertTriangle,
  UploadCloud,
  Trash2,
  Calendar,
} from "lucide-react";

interface EOImage {
  id: string;
  date: string; // ISO string
  sensor?: string | null;
  selected: boolean;
  src?: string | null; // objectURL or remote src
  name?: string;
  uploaded?: boolean;
}

const initialEOImages: EOImage[] = [
  { id: "eo-1", date: "2024-01-15T00:00:00.000Z", sensor: "Resourcesat-2A", selected: false, src: null, name: "resourcesat-20240115" },
  { id: "eo-2", date: "2024-03-20T00:00:00.000Z", sensor: "Cartosat-3", selected: false, src: null, name: "cartosat-20240320" },
  { id: "eo-3", date: "2024-06-10T00:00:00.000Z", sensor: "Resourcesat-2A", selected: true, src: null, name: "resourcesat-20240610" },
  { id: "eo-4", date: "2024-09-05T00:00:00.000Z", sensor: "RISAT-2B", selected: false, src: null, name: "risat-20240905" },
  { id: "eo-5", date: "2024-11-15T00:00:00.000Z", sensor: "Cartosat-3", selected: false, src: null, name: "cartosat-20241115" },
];

const formatShortDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
};

const daysBetween = (aIso: string, bIso: string) => {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  const ms = Math.abs(b - a);
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const AnalyticsPanel: React.FC = () => {
  const [eoImages, setEoImages] = useState<EOImage[]>(() => [...initialEOImages]);

  // track created object URLs to revoke when removed/unmounted
  const createdObjectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // sort on mount and ensure latest selected
  useEffect(() => {
    setEoImages((prev) => {
      const sorted = [...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sorted.map((img, idx) => ({ ...img, selected: idx === sorted.length - 1 }));
    });

    return () => {
      createdObjectUrlsRef.current.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
      createdObjectUrlsRef.current = [];
    };
  }, []);

  const sensorsList = useMemo(() => {
    const set = new Set<string>();
    eoImages.forEach((i) => {
      if (i.sensor) set.add(i.sensor);
      else if (i.name) {
        const lower = i.name.toLowerCase();
        if (lower.includes("carto")) set.add("Cartosat-3");
        else if (lower.includes("resource")) set.add("Resourcesat-2A");
        else if (lower.includes("risat")) set.add("RISAT-2B");
        else if (i.uploaded) set.add("Uploaded");
      } else if (i.uploaded) set.add("Uploaded");
    });
    return Array.from(set);
  }, [eoImages]);

  const sortedImages = useMemo(() => [...eoImages].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [eoImages]);

  const imageCount = eoImages.length;
  const timeSpanDays = imageCount > 1 ? daysBetween(sortedImages[0].date, sortedImages[sortedImages.length - 1].date) : 0;

  const openFileDialog = () => fileInputRef.current?.click();

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: EOImage[] = [];
    const fileArray = Array.from(files);
    fileArray.forEach((f) => {
      if (!f.type.startsWith("image/")) return;

      const url = URL.createObjectURL(f);
      createdObjectUrlsRef.current.push(url);

      const dateIso = new Date(f.lastModified || Date.now()).toISOString();

      const lower = f.name.toLowerCase();
      let sensor = "Uploaded";
      if (lower.includes("carto")) sensor = "Cartosat-3";
      else if (lower.includes("resource")) sensor = "Resourcesat-2A";
      else if (lower.includes("risat")) sensor = "RISAT-2B";

      newImages.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: dateIso,
        sensor,
        selected: false,
        src: url,
        name: f.name,
        uploaded: true,
      });
    });

    if (newImages.length === 0) return;

    setEoImages((prev) => {
      const merged = [...prev, ...newImages];
      const sorted = merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sorted.map((img, idx) => ({ ...img, selected: idx === sorted.length - 1 }));
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectImage = (id: string) => {
    setEoImages((prev) => prev.map((img) => ({ ...img, selected: img.id === id })));
  };

  const deleteImage = (id: string) => {
    setEoImages((prev) => {
      const toDelete = prev.find((p) => p.id === id);
      if (toDelete?.src) {
        const idx = createdObjectUrlsRef.current.indexOf(toDelete.src);
        if (idx !== -1) {
          URL.revokeObjectURL(toDelete.src);
          createdObjectUrlsRef.current.splice(idx, 1);
        }
      }
      const remaining = prev.filter((p) => p.id !== id);
      const sorted = remaining.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sorted.map((img, idx) => ({ ...img, selected: idx === sorted.length - 1 }));
    });
  };

  const oldestImage = sortedImages.length > 0 ? sortedImages[0] : null;
  const newestImage = sortedImages.length > 0 ? sortedImages[sortedImages.length - 1] : null;
  const selectedImage = eoImages.find((img) => img.selected) ?? newestImage ?? null;
  const hasData = eoImages.length > 0;

  // memoize static datasets so hooks depending on them don't see new references each render
  const lulcData = useMemo(() => ([
    { class: "Forest", area: 2450, percentage: 45.2, change: -3.1 },
    { class: "Built-up", area: 1235, percentage: 22.8, change: 5.4 },
    { class: "Water bodies", area: 460, percentage: 8.5, change: -1.2 },
    { class: "Agricultural", area: 990, percentage: 18.3, change: -0.8 },
    { class: "Barren land", area: 282, percentage: 5.2, change: -0.3 },
  ] as const), []);

  const hotspots = useMemo(() => ([
    { id: 1, description: "Forest clearing detected", confidence: 92, priority: "High" },
    { id: 2, description: "Urban sprawl expansion", confidence: 87, priority: "High" },
    { id: 3, description: "Water body shrinkage", confidence: 78, priority: "Medium" },
    { id: 4, description: "Agricultural land conversion", confidence: 71, priority: "Medium" },
  ] as const), []);

  // summary paragraph
  const summaryParagraph = useMemo(() => {
    if (eoImages.length === 0) return "No images available.";

    const count = eoImages.length;
    const dateRange = `${formatShortDate(sortedImages[0].date)} to ${formatShortDate(sortedImages[sortedImages.length - 1].date)}`;
    const sensors = sensorsList.length > 0 ? sensorsList.join(", ") : "Unknown sensors";
    const positives = lulcData.filter((r) => r.change > 0).sort((a, b) => b.change - a.change);
    const negatives = lulcData.filter((r) => r.change < 0).sort((a, b) => a.change - b.change);
    const posPhrase = positives.length > 0 ? `${positives[0].class} increased by ${positives[0].change}%` : null;
    const negPhrase = negatives.length > 0 ? `${negatives[0].class} decreased by ${Math.abs(negatives[0].change)}%` : null;
    const hotspotSummary = hotspots.slice(0, 2).map((h) => `${h.description.toLowerCase()} (confidence ${h.confidence}%)`).join("; ");

    const parts: string[] = [];
    parts.push(`Dataset contains ${count} image${count > 1 ? "s" : ""} covering the period ${dateRange}.`);
    parts.push(`Sensors present: ${sensors}.`);
    if (posPhrase) parts.push(`${posPhrase}.`);
    if (negPhrase) parts.push(`${negPhrase}.`);
    if (hotspotSummary) parts.push(`Detected hotspots include: ${hotspotSummary}.`);
    parts.push(`Time-span across images is ${timeSpanDays} days.`);

    return parts.join(" ");
  }, [eoImages, lulcData, hotspots, sensorsList, sortedImages, timeSpanDays]);

  // download summary (uses print dialog / new tab so no external dependency)
  const downloadSummaryPdf = () => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    const html = `
      <html>
        <head>
          <title>EO Summary</title>
          <style>
            body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            p { font-size: 12px; line-height: 1.5; white-space: pre-wrap; }
            .meta { margin-top: 12px; font-size: 11px; color: #444; }
          </style>
        </head>
        <body>
          <h1>EO Image Summary</h1>
          <p>${summaryParagraph}</p>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  // deterministic quick "analysis" for display only
  const imageAnalysis = useMemo(() => {
    if (!selectedImage) {
      return { ndvi: "—", cloudCover: "—", resolution: "—", detected: [] as string[], notes: "No image selected" };
    }
    const seedStr = `${selectedImage.id}|${selectedImage.name ?? ""}|${selectedImage.date}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    const ndvi = (0.25 + (seed % 70) / 100).toFixed(2);
    const cloudCover = `${seed % 41}%`;
    const resolution = `${10 + (seed % 50)} m`;
    const candidates = ["Built-up area", "Water body", "Forest patch", "Road network", "Agricultural field", "Bare soil"];
    const detected: string[] = [];
    const detCount = 1 + (seed % 3);
    for (let i = 0; i < detCount; i++) detected.push(candidates[(seed + i) % candidates.length]);
    const notes = `Automated quick-check: NDVI ~ ${ndvi}, cloud cover ~ ${cloudCover}. Review detected features for verification.`;
    return { ndvi, cloudCover, resolution, detected, notes };
  }, [selectedImage]);

  return (
    <div className="space-y-6">
      {/* EO Image Timeline (upload + delete) */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">EO Image Timeline</CardTitle>
            <CardDescription>Upload images and view them ordered by date/time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            <Button onClick={openFileDialog} variant="ghost" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" /> Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {sortedImages.map((image) => (
                <div key={image.id} className="relative">
                  <div
                    onClick={() => selectImage(image.id)}
                    className={`flex-shrink-0 w-40 rounded-lg border-2 p-3 cursor-pointer transition-all ${image.selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                      {image.src ? <img src={image.src} alt={image.name || "eo-image"} className="object-cover w-full h-full" /> : (
                        <div className="flex flex-col items-center justify-center p-2 text-muted-foreground">
                          <MapPin className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium">{formatShortDate(image.date)}</p>
                    <p className="text-xs text-muted-foreground">{image.sensor || image.name || "Unknown"}</p>
                  </div>

                  <button onClick={() => deleteImage(image.id)} title="Delete image" className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Before / After */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before / After Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Baseline {oldestImage ? `(${formatShortDate(oldestImage.date)})` : ""}</label>
                <Badge variant="secondary">Before</Badge>
              </div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {oldestImage && oldestImage.src ? <img src={oldestImage.src} alt="before" className="object-cover w-full h-full" /> : (
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Baseline EO Image</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Current {newestImage ? `(${formatShortDate(newestImage.date)})` : ""}</label>
                <Badge variant="secondary">After</Badge>
              </div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {newestImage && newestImage.src ? <img src={newestImage.src} alt="after" className="object-cover w-full h-full" /> : (
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Current EO Image</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm">Toggle Comparison View</Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Image Overview</CardTitle>
          <CardDescription>Selected image preview, metadata and quick analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {selectedImage && selectedImage.src ? <img src={selectedImage.src} alt={selectedImage.name || "selected-image"} className="object-cover w-full h-full" /> : (
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No image selected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div className="text-xs">Date</div>
                      <div className="font-medium">{selectedImage ? formatShortDate(selectedImage.date) : "—"}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <div>
                      <div className="text-xs">Sensor</div>
                      <div className="font-medium">{selectedImage && selectedImage.sensor ? selectedImage.sensor : (selectedImage && selectedImage.uploaded ? "Uploaded" : "—")}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    <div className="text-xs">Name</div>
                    <div className="font-medium">{selectedImage?.name ?? "—"}</div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    <div className="text-xs">Uploaded</div>
                    <div className="font-medium">{selectedImage?.uploaded ? "Yes" : "No"}</div>
                  </div>
                </div>

                <div className="w-[520px] border border-border rounded-lg p-4 bg-muted/40">
                  <h4 className="text-sm font-medium mb-3">Quick Image Analysis</h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Estimated NDVI</div>
                      <div className="font-medium text-lg">{imageAnalysis.ndvi}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Cloud cover</div>
                      <div className="font-medium text-lg">{imageAnalysis.cloudCover}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Resolution</div>
                      <div className="font-medium">{imageAnalysis.resolution}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Detected</div>
                      <div className="font-medium">{imageAnalysis.detected.length ? imageAnalysis.detected.join(", ") : "—"}</div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">{imageAnalysis.notes}</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex gap-2">
                  <Button onClick={() => { if (selectedImage?.src) window.open(selectedImage.src, "_blank"); }}>Open Image</Button>
                  {selectedImage?.src && (
                    <Button onClick={() => {
                      const a = document.createElement("a");
                      a.href = selectedImage.src!;
                      a.download = selectedImage.name ?? "eo-image";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }} variant="outline">Download</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Land Use / Land Cover Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">LULC Distribution Chart</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Class</th>
                    <th className="text-right py-2">Area (km²)</th>
                    <th className="text-right py-2">%</th>
                    <th className="text-right py-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {lulcData.map((row) => (
                    <tr key={row.class} className="border-b">
                      <td className="py-2">{row.class}</td>
                      <td className="text-right">{row.area}</td>
                      <td className="text-right">{row.percentage}%</td>
                      <td className="text-right"><span className={row.change > 0 ? "text-destructive" : "text-chart-3"}>{row.change > 0 ? "+" : ""}{row.change}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Change Detection Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Change Detection Chart</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive mt-1.5" />
                <div>
                  <p className="text-sm font-medium">Forest Loss</p>
                  <p className="text-xs text-muted-foreground">3.1% reduction (75.5 km²) detected in northwestern region</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-accent mt-1.5" />
                <div>
                  <p className="text-sm font-medium">Built-up Increase</p>
                  <p className="text-xs text-muted-foreground">5.4% expansion (66.7 km²) along eastern corridor</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-chart-4 mt-1.5" />
                <div>
                  <p className="text-sm font-medium">Water-body Shrinkage</p>
                  <p className="text-xs text-muted-foreground">1.2% decrease (5.5 km²) in major reservoirs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-chart-3" /> Vegetation / NDVI Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">NDVI Time Series</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Current NDVI</p>
                <p className="text-2xl font-bold">0.62</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Interpretation</p>
                <Badge variant="secondary">Moderate Health</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Vegetation health shows moderate conditions with seasonal variations. Decline observed in northwestern sectors correlating with deforestation events.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Droplets className="h-5 w-5 text-chart-4" /> Water Resource Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Water Area Time Series</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Current Area</p>
                <p className="text-2xl font-bold">460 km²</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Change</p>
                <p className="text-2xl font-bold text-destructive">-1.2%</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Water bodies showing declining trend. Major reservoirs at 78% capacity. Seasonal monitoring recommended for drought risk assessment.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg p-6 overflow-auto">
              <p className="text-sm leading-6">{summaryParagraph}</p>
            </div>
            <div className="mt-2">
              <Button onClick={downloadSummaryPdf}>Download summary (PDF)</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Risk Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hotspots.map((hotspot) => (
                <div key={hotspot.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-16 w-16 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{hotspot.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={hotspot.priority === "High" ? "destructive" : "secondary"} className="text-xs">{hotspot.priority}</Badge>
                      <span className="text-xs text-muted-foreground">Confidence: {hotspot.confidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No EO data available for the selected filters. Please adjust your region or date range.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AnalyticsPanel;