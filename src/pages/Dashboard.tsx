
import { Search, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const primaryToggles = [
  { label: "Complex Reasoning", id: "complex" },
  { label: "Mathematical Problem-Solving", id: "math" },
  { label: "Coding", id: "coding" },
  { label: "Creating a copilot", id: "copilot" },
];

const secondaryToggles = [
  { label: "Token Saver prompt", id: "token" },
  { label: "Strict Response", id: "strict" },
  { label: "Creative", id: "creative" },
];

const historyItems = Array.from({ length: 10 }, (_, i) => ({
  title: "Title and Date",
  id: `history-${i}`,
}));

const Dashboard = () => {
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);

  const handlePrimaryToggle = (id: string) => {
    setSelectedPrimary(currentSelected => currentSelected === id ? null : id);
  };

  const handleSecondaryToggle = (id: string) => {
    setSelectedSecondary(currentSelected => currentSelected === id ? null : id);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex items-center justify-center">
            <div className="w-full">
              {/* Primary Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {primaryToggles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <span className="text-sm text-card-foreground">{item.label}</span>
                    <Switch 
                      id={item.id}
                      checked={selectedPrimary === item.id}
                      onCheckedChange={() => handlePrimaryToggle(item.id)}
                    />
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Secondary Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {secondaryToggles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <span className="text-sm text-card-foreground">{item.label}</span>
                    <Switch 
                      id={item.id}
                      checked={selectedSecondary === item.id}
                      onCheckedChange={() => handleSecondaryToggle(item.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="border rounded-xl p-6 bg-card min-h-[400px] relative">
                <textarea 
                  className="w-full h-[300px] bg-transparent resize-none outline-none text-card-foreground placeholder:text-muted-foreground"
                  placeholder="Start by typing your prompt"
                />
                <button className="absolute bottom-6 right-6 bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity">
                  Analyze
                </button>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-border" />
                <div className="w-2 h-2 rounded-full bg-border" />
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <Sidebar side="right">
          <SidebarContent>
            {/* User Section */}
            <div className="p-4 flex items-center gap-3 border-b">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="font-medium">User Name</span>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search..." />
              </div>
            </div>

            {/* History List */}
            <div className="overflow-auto">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b hover:bg-accent cursor-pointer transition-colors flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="text-sm">{item.title}</span>
                </div>
              ))}
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Sidebar Trigger */}
        <div className="absolute top-6 right-6">
          <SidebarTrigger />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
