import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatPanel from "@/components/ChatPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import InsightsPanel from "@/components/InsightsPanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="chat">
              Multimodal EO Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="analytics">
              EO AND TIME SERIES ANALYSIS
            </TabsTrigger>
            <TabsTrigger value="insights">
              REAL TIME MONITORING
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <ChatPanel />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsPanel />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <InsightsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;