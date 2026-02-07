"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, FileText, DollarSign, UserPlus, Search, Filter, Calendar, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mock Data matching user request
const AGENT_TYPES = ["Invoice Interpreter", "Payment Creator", "Contact Manager"] as const;

const MOCK_ACTIVITIES = [
    {
        id: "1",
        agent: "Invoice Interpreter",
        action: "Extracted data from medical_invoice.pdf",
        details: "Identified client 'John Doe' and amount '$450.00'",
        target: "INV-2024-001",
        relatedInvoice: "INV-2024-001",
        walletId: "0x71C...9A2",
        timestamp: "2024-02-07T10:30:00",
        status: "success"
    },
    {
        id: "2",
        agent: "Invoice Interpreter",
        action: "Extracted data from repair_bill.png",
        details: "Identified client 'Alice Smith' and amount '$1,200.00'",
        target: "INV-2024-002",
        relatedInvoice: "INV-2024-002",
        walletId: "0x89A...B31",
        timestamp: "2024-02-07T11:15:00",
        status: "success"
    },
    {
        id: "3",
        agent: "Contact Manager",
        action: "Created new contact",
        details: "Added 'Alice Smith' to directory from invoice metadata",
        target: "Alice Smith",
        relatedInvoice: "INV-2024-002",
        walletId: "0x89A...B31",
        timestamp: "2024-02-07T11:15:05",
        status: "success"
    },
    {
        id: "4",
        agent: "Payment Creator",
        action: "Initiated Payment",
        details: "Scheduled payment of $450.00 to 0x71C...9A2",
        target: "INV-2024-001",
        relatedInvoice: "INV-2024-001",
        walletId: "0x71C...9A2",
        timestamp: "2024-02-07T10:35:00",
        status: "processing"
    },
    {
        id: "5",
        agent: "Invoice Interpreter",
        action: "Failed to read document",
        details: "Resolution too low for OCR processing",
        target: "scan_003.jpg",
        relatedInvoice: "N/A",
        walletId: "Unknown",
        timestamp: "2024-02-06T19:20:00",
        status: "failed"
    },
    {
        id: "6",
        agent: "Payment Creator",
        action: "Payment Completed",
        details: "Transaction 0x999... confirmed on chain",
        target: "INV-2024-001",
        relatedInvoice: "INV-2024-001",
        walletId: "0x71C...9A2",
        timestamp: "2024-02-07T10:45:00",
        status: "success"
    },
    {
        id: "7",
        agent: "Contact Manager",
        action: "Updated contact preferences",
        details: "Set default payment token to USDC for 'John Doe'",
        target: "John Doe",
        relatedInvoice: "N/A",
        walletId: "0x71C...9A2",
        timestamp: "2024-02-05T14:20:00",
        status: "success"
    }
];

export default function AgentsPage() {
    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const uniqueAgents = Array.from(new Set(MOCK_ACTIVITIES.map(a => a.agent)));

    const filteredActivities = MOCK_ACTIVITIES.filter(activity => {
        const matchesAgent = filter === "all" || activity.agent === filter;
        const matchesSearch = activity.action.toLowerCase().includes(search.toLowerCase()) ||
            activity.target.toLowerCase().includes(search.toLowerCase()) ||
            activity.details.toLowerCase().includes(search.toLowerCase()) ||
            (activity.relatedInvoice && activity.relatedInvoice.toLowerCase().includes(search.toLowerCase())) ||
            (activity.walletId && activity.walletId.toLowerCase().includes(search.toLowerCase()));
        return matchesAgent && matchesSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Group activities by Wallet -> Invoice
    const groupedData = filteredActivities.reduce((acc, activity) => {
        const wallet = activity.walletId || "Unknown Wallet";
        if (!acc[wallet]) acc[wallet] = {};

        const invoice = activity.relatedInvoice && activity.relatedInvoice !== "N/A"
            ? activity.relatedInvoice
            : "General Activities";

        if (!acc[wallet][invoice]) acc[wallet][invoice] = [];
        acc[wallet][invoice].push(activity);
        return acc;
    }, {} as Record<string, Record<string, typeof MOCK_ACTIVITIES>>);

    const getAgentIcon = (agent: string) => {
        switch (agent) {
            case "Invoice Interpreter": return FileText;
            case "Payment Creator": return DollarSign;
            case "Contact Manager": return UserPlus;
            default: return Bot;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success": return "bg-green-500/10 text-green-500 border-green-200";
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-200";
            case "failed": return "bg-red-500/10 text-red-500 border-red-200";
            default: return "bg-gray-500/10 text-gray-500";
        }
    };

    const getDotColor = (status: string) => {
        switch (status) {
            case "success": return "border-green-500 text-green-600";
            case "processing": return "border-blue-500 text-blue-600";
            case "failed": return "border-red-500 text-red-600";
            default: return "border-gray-500 text-gray-600";
        }
    };

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Agents">
                <Button size="sm" variant="outline" className="gap-2">
                    <Bot className="w-4 h-4" />
                    Manage Agents
                </Button>
            </PageHeader>

            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="px-6 py-2 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 items-center">
                        <Button
                            variant={filter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("all")}
                            className={cn("rounded-full", filter === "all" && "bg-primary text-primary-foreground")}
                        >
                            All Activities
                        </Button>
                        {uniqueAgents.map(agent => (
                            <Button
                                key={agent}
                                variant={filter === agent ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter(agent)}
                                className={cn("rounded-full whitespace-nowrap", filter === agent && "bg-primary text-primary-foreground")}
                            >
                                {agent}
                            </Button>
                        ))}
                    </div>

                    <div className="flex-1 md:ml-auto max-w-sm relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search activities, invoices, or wallets..."
                            className="pl-9 h-8 bg-muted/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-muted/10">
                <div className="max-w-4xl mx-auto space-y-8">
                    {Object.keys(groupedData).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No activities found matching your filters.</p>
                        </div>
                    ) : (
                        Object.entries(groupedData).map(([walletId, invoiceGroups]) => (
                            <div key={walletId} className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-1">
                                    <Wallet className="w-4 h-4" />
                                    <span>Wallet: <span className="font-mono text-foreground">{walletId}</span></span>
                                </div>

                                {Object.entries(invoiceGroups).map(([groupTitle, activities]) => (
                                    <Card key={groupTitle} className="overflow-hidden border-none shadow-sm bg-background/50 backdrop-blur-sm">
                                        <CardHeader className="bg-background pb-3 py-3 border-b flex flex-row items-center justify-between space-y-0">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-background rounded-md border shadow-sm">
                                                    {groupTitle === "General Activities" ? (
                                                        <Bot className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-mono tracking-tight">{groupTitle}</CardTitle>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-background">{activities.length} Actions</Badge>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="relative pl-6 border-l-2 border-muted space-y-8 ml-2">
                                                {activities.map((activity) => {
                                                    const Icon = getAgentIcon(activity.agent);
                                                    return (
                                                        <div key={activity.id} className="relative group">
                                                            {/* Timeline dot */}
                                                            <span className={cn(
                                                                "absolute -left-[32px] top-1 p-1 rounded-full border-2 bg-background transition-colors",
                                                                getDotColor(activity.status)
                                                            )}>
                                                                <Icon className="w-3 h-3" />
                                                            </span>

                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 pb-1">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-sm">{activity.agent}</span>
                                                                        <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5 capitalize", getStatusColor(activity.status))}>
                                                                            {activity.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="font-medium text-sm text-foreground/90">{activity.action}</p>
                                                                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap pt-1 sm:pt-0">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <time>
                                                                        {new Date(activity.timestamp).toLocaleString(undefined, {
                                                                            month: 'short', day: 'numeric',
                                                                            hour: 'numeric', minute: '2-digit'
                                                                        })}
                                                                    </time>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
