export const FEEDS = [
    { id: "0x0100000000000000000000000000000000000001", name: "BTC/USD", symbol: "BTC" },
    { id: "0x0200000000000000000000000000000000000002", name: "ETH/USD", symbol: "ETH" },
    { id: "0x0300000000000000000000000000000000000003", name: "FLR/USD", symbol: "FLR" },
] as const;

export const getFeedName = (id: string) => {
    const feed = FEEDS.find(f => f.id === id);
    return feed ? feed.name : "Unknown Feed";
};

export const getFeedSymbol = (id: string) => {
    const feed = FEEDS.find(f => f.id === id);
    return feed ? feed.symbol : "???";
};
