import { Button } from "@/components/ui/button";
import { ConnectWallet } from "../wallet/ConnectWallet";

export function Header() {
    return (
        <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded-full animate-pulse" />
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            Flare Insurance
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <a href="/" className="hover:text-primary transition-colors">Home</a>
                        <a href="/claims" className="hover:text-primary transition-colors">Claims</a>
                        <a href="/prices" className="hover:text-primary transition-colors">Prices</a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <ConnectWallet />
                    </div>
                </div>
            </div>
        </header>
    );
}
