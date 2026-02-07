import { PriceDashboard } from "../../components/prices/PriceDashboard";

export default function PricesPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-serif mb-2">
                    Prices
                </h1>
                <p className="text-muted-foreground">
                    Real-time cryptocurrency prices from FTSO
                </p>
            </div>
            <PriceDashboard />
        </div>
    );
}
