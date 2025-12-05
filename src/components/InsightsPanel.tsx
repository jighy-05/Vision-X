import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const InsightsPanel: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("mumbai");
  const [startDate, setStartDate] = useState<string>("2024-01-01");
  const [endDate, setEndDate] = useState<string>("2024-11-21");

  return (
    <div className="space-y-6">
      {/* Analysis Filters (same as requested) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Filters</CardTitle>
          <CardDescription>Select region and time window for EO analysis</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Region / AOI</label>
              <Select value={selectedRegion} onValueChange={(v) => setSelectedRegion(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mumbai">Mumbai Metropolitan</SelectItem>
                  <SelectItem value="delhi">Delhi NCR</SelectItem>
                  <SelectItem value="bangalore">Bangalore Urban</SelectItem>
                  <SelectItem value="kerala">Kerala Backwaters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={() => { /* apply placeholder */ }}>
                Apply
              </Button>
              <Button variant="outline" onClick={() => { setSelectedRegion("mumbai"); setStartDate("2024-01-01"); setEndDate("2024-11-21"); }}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coming Soon</CardTitle>
          <CardDescription>Insights & automation tools will be available soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-sm text-muted-foreground">
            The insights dashboard is under construction. Reports, AI summaries and alerting will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPanel;