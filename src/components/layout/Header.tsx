import { Button } from "@/components/ui/button";
import { ConnectWallet } from "../wallet/ConnectWallet";
import { Home, FileText, TrendingUp } from "lucide-react";

export function Header() {
    return (
        <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6 w-full">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded-full animate-pulse" />
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            SLAPSure
                        </span>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
                    <a href="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Home className="w-4 h-4" />
                        Home
                    </a>
                    <a href="/claims" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <FileText className="w-4 h-4" />
                        Claims
                    </a>
                    <a href="/prices" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <TrendingUp className="w-4 h-4" />
                        Prices
                    </a>
                </nav>

                <div className="flex items-center gap-2">
                    <ConnectWallet />
                </div>
            </div>
        </header>
    );
}
