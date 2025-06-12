"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Star,
  Filter,
  Bell,
  Target,
  ArrowUp,
  ArrowDown,
  DollarSign,
} from "lucide-react";
import { useDataContext } from "@/context/DataContext";

const TokenNewsApp: React.FC = () => {
  const {
    isLive,
    isLoading,
    lastUpdate,
    registerRefreshCallback,
    unregisterRefreshCallback,
  } = useDataContext();
  const [selectedToken, setSelectedToken] = useState<string>("bitcoin");
  const [newsFilter, setNewsFilter] = useState<NewsFilter>("all");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [error, setError] = useState<string>("");

  // Token mapping for API calls
  const tokenMapping = {
    bitcoin: { symbol: "BTC", coingeckoId: "bitcoin", newsQuery: "Bitcoin" },
    ethereum: { symbol: "ETH", coingeckoId: "ethereum", newsQuery: "Ethereum" },
    solana: { symbol: "SOL", coingeckoId: "solana", newsQuery: "Solana" },
    cardano: { symbol: "ADA", coingeckoId: "cardano", newsQuery: "Cardano" },
    binancecoin: {
      symbol: "BNB",
      coingeckoId: "binancecoin",
      newsQuery: "Binance Coin",
    },
    ripple: { symbol: "XRP", coingeckoId: "ripple", newsQuery: "Ripple" },
  };

  // Fetch cryptocurrency data from CoinGecko API
  const fetchCryptoData = useCallback(async (): Promise<void> => {
    setError("");
    try {
      const tokenIds = Object.keys(tokenMapping).join(",");
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CryptoAPIResponse[] = await response.json();

      const formattedTokens: Token[] = data.map((token) => {
        const currentPrice = token.current_price;
        const high24h = token.high_24h;
        const low24h = token.low_24h;

        const support = low24h * 0.98;
        const resistance = high24h * 1.02;

        const priceHistory = Array.from(
          { length: 5 },
          (_, i) => currentPrice * (0.95 + Math.random() * 0.1)
        );

        return {
          symbol:
            tokenMapping[token.id as keyof typeof tokenMapping]?.symbol ||
            token.symbol.toUpperCase(),
          name: token.name,
          price: `$${currentPrice.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`,
          change: `${
            token.price_change_percentage_24h >= 0 ? "+" : ""
          }${token.price_change_percentage_24h.toFixed(2)}%`,
          changePercent: token.price_change_percentage_24h,
          priceHistory,
          volume24h: `$${(token.total_volume / 1e9).toFixed(1)}B`,
          marketCap: `$${(token.market_cap / 1e9).toFixed(1)}B`,
          support,
          resistance,
          high24h,
          low24h,
          lastUpdated: new Date(token.last_updated),
        };
      });

      setTokens(formattedTokens);
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      setError("Failed to fetch cryptocurrency data. Using cached data.");

      if (tokens.length === 0) {
        setTokens([
          {
            symbol: "BTC",
            name: "Bitcoin",
            price: "$67,234",
            change: "+2.34%",
            changePercent: 2.34,
            priceHistory: [65000, 66500, 67000, 66800, 67234],
            volume24h: "$28.5B",
            marketCap: "$1.32T",
            support: 65000,
            resistance: 69000,
            high24h: 68000,
            low24h: 65500,
            lastUpdated: new Date(),
          },
        ]);
      }
    }
  }, [tokens.length]);

  // Simple sentiment analysis heuristic
  const analyzeSentiment = (
    title: string,
    description: string
  ): "positive" | "negative" | "neutral" => {
    const text = (title + " " + description).toLowerCase();
    const positiveWords = [
      "bullish",
      "surge",
      "rise",
      "gain",
      "success",
      "growth",
      "adoption",
    ];
    const negativeWords = [
      "bearish",
      "crash",
      "drop",
      "decline",
      "loss",
      "scam",
      "hack",
    ];

    let score = 0;
    positiveWords.forEach((word) => {
      if (text.includes(word)) score += 1;
    });
    negativeWords.forEach((word) => {
      if (text.includes(word)) score -= 1;
    });

    if (score > 0) return "positive";
    if (score < 0) return "negative";
    return "neutral";
  };

  // Fetch cryptocurrency news from NewsAPI
  const fetchCryptoNews = useCallback(async (): Promise<void> => {
    setError("");
    try {
      const tokenInfo =
        tokenMapping[selectedToken as keyof typeof tokenMapping];
      const query = tokenInfo?.newsQuery || "cryptocurrency";
      const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(
          query
        )}&language=en&sortBy=publishedAt&apiKey=${apiKey}&pageSize=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.articles || [];

      const formattedNews: NewsArticle[] = articles.map(
        (article: any, index: number) => {
          const publishedAt = new Date(article.publishedAt);
          const title = article.title || "No title available";
          const description =
            article.description || article.content || "No summary available";
          const source = article.source?.name || "Unknown Source";
          const url = article.url || "#";
          const sentiment = analyzeSentiment(title, description);

          return {
            id: article.url || `${query}-${index}`, // Fallback ID if url is missing
            title,
            source,
            time: formatTimeAgo(publishedAt),
            sentiment,
            relevance: query === "cryptocurrency" ? 70 : 90, // Higher relevance for token-specific queries
            summary:
              description.slice(0, 200) +
              (description.length > 200 ? "..." : ""),
            url,
            trending: index < 2, // Assume top 2 articles are trending
            publishedAt,
          };
        }
      );

      setNewsData(formattedNews);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to fetch news data. Using cached news.");

      if (newsData.length === 0) {
        setNewsData([
          {
            id: "fallback-1",
            title: "Cryptocurrency Market Update",
            source: "Fallback Source",
            time: formatTimeAgo(new Date()),
            sentiment: "neutral",
            relevance: 70,
            summary:
              "No live news available. Check your API key or internet connection.",
            url: "#",
            trending: false,
            publishedAt: new Date(),
          },
        ]);
      }
    }
  }, [selectedToken, newsData.length]);

  // Handle refresh for TokenNewsApp
  const handleRefresh = useCallback(async () => {
    await fetchCryptoData(); // Only fetch crypto prices
  }, [fetchCryptoData]);

  // Register refresh callback for crypto prices on mount, unregister on unmount
  useEffect(() => {
    registerRefreshCallback(handleRefresh);
    return () => unregisterRefreshCallback();
  }, [registerRefreshCallback, unregisterRefreshCallback, handleRefresh]);

  // Initial data fetch
  useEffect(() => {
    fetchCryptoData();
    fetchCryptoNews();
  }, [fetchCryptoData, fetchCryptoNews]);

  // Periodic news fetch every 5 minutes
  useEffect(() => {
    // Initial fetch is handled by the above useEffect, so we only set up the interval here
    const newsInterval = setInterval(() => {
      fetchCryptoNews();
    }, 300000); // 5 minutes = 300,000 milliseconds

    // Clean up interval on component unmount
    return () => clearInterval(newsInterval);
  }, [fetchCryptoNews]);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Generate trading suggestion
  const generateTradingSuggestion = (token: Token): TradingSuggestion => {
    const currentPrice = parseFloat(token.price.replace(/[$,]/g, ""));
    const changePercent = token.changePercent;
    const supportDistance =
      ((currentPrice - token.support) / currentPrice) * 100;
    const resistanceDistance =
      ((token.resistance - currentPrice) / currentPrice) * 100;

    const recentNews = newsData.filter((news) => news.relevance > 80);
    const positiveNews = recentNews.filter(
      (news) => news.sentiment === "positive"
    ).length;
    const negativeNews = recentNews.filter(
      (news) => news.sentiment === "negative"
    ).length;
    const sentimentScore =
      recentNews.length > 0
        ? (positiveNews - negativeNews) / recentNews.length
        : 0;

    let action: "buy" | "sell" | "hold" = "hold";
    let confidence = 50;
    let reasoning = "";
    let priceTarget = currentPrice;
    let stopLoss = currentPrice * 0.95;

    if (changePercent > 2 && supportDistance > 5 && sentimentScore > 0.2) {
      action = "buy";
      confidence = Math.min(85, 60 + changePercent * 2 + sentimentScore * 20);
      priceTarget = token.resistance * 0.95;
      stopLoss = token.support * 1.02;
      reasoning = `Strong upward momentum (+${changePercent.toFixed(
        1
      )}%) with positive sentiment. Price well above support level.`;
    } else if (changePercent < -1.5 && resistanceDistance < 3) {
      action = "sell";
      confidence = Math.min(80, 55 + Math.abs(changePercent * 1.5));
      priceTarget = token.support * 1.05;
      stopLoss = token.resistance * 0.98;
      reasoning = `Negative price action near resistance. Consider taking profits or reducing position.`;
    } else if (supportDistance < 2) {
      action = "buy";
      confidence = 70;
      priceTarget = currentPrice * 1.08;
      stopLoss = token.support * 0.98;
      reasoning = `Price approaching strong support level. Good risk/reward opportunity.`;
    } else {
      reasoning = `Price in neutral zone. Wait for clearer signals near support ($${token.support.toLocaleString()}) or resistance ($${token.resistance.toLocaleString()}).`;
    }

    return {
      action,
      confidence,
      priceTarget,
      stopLoss,
      reasoning,
      timeframe: action === "hold" ? "Wait for setup" : "1-7 days",
    };
  };

  const getSelectedTokenData = (): Token | undefined => {
    return tokens.find(
      (token) =>
        token.symbol ===
        tokenMapping[selectedToken as keyof typeof tokenMapping]?.symbol
    );
  };

  const getSentimentColor = (sentiment: NewsArticle["sentiment"]): string => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-green-100";
      case "negative":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRelevanceColor = (relevance: number): string => {
    if (relevance >= 90) return "text-blue-600 bg-blue-100";
    if (relevance >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case "buy":
        return "text-green-600 bg-green-100 border-green-200";
      case "sell":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-blue-600 bg-blue-100 border-blue-200";
    }
  };

  const handleTokenSelect = (tokenId: string): void => {
    setSelectedToken(tokenId);
    fetchCryptoNews(); // Fetch news for the new token immediately
  };

  const handleNewsFilter = (filter: NewsFilter): void => {
    setNewsFilter(filter);
  };

  const filteredNews: NewsArticle[] = newsData.filter((news) => {
    if (newsFilter === "positive") return news.sentiment === "positive";
    if (newsFilter === "negative") return news.sentiment === "negative";
    if (newsFilter === "trending") return news.trending;
    return true;
  });

  const selectedTokenData = getSelectedTokenData();
  const tradingSuggestion = selectedTokenData
    ? generateTradingSuggestion(selectedTokenData)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">{error}</p>
            </div>
          </div>
        )}

        {/* Token Selection */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-main mb-4">Select Token</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(tokenMapping).map(([tokenId, tokenInfo]) => {
              const tokenData = tokens.find(
                (t) => t.symbol === tokenInfo.symbol
              );
              return (
                <button
                  key={tokenId}
                  onClick={() => handleTokenSelect(tokenId)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedToken === tokenId
                      ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/25"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        {tokenInfo.symbol}
                      </span>
                      {tokenData && (
                        <span
                          className={`text-sm font-medium ${
                            tokenData.changePercent >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tokenData.change}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">
                      {tokenData?.name || tokenInfo.symbol}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {tokenData?.price || "Loading..."}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Trading Suggestion Card */}
        {selectedTokenData && tradingSuggestion && (
          <section className="mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Target className="h-6 w-6 mr-2 text-blue-600" />
                  Trading Analysis for {selectedTokenData.symbol}
                </h2>
                <div className="text-sm text-gray-500">
                  Updated {selectedTokenData.lastUpdated.toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Current Price</div>
                      <div className="text-xl font-bold text-gray-900">
                        {selectedTokenData.price}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">24h Change</div>
                      <div
                        className={`text-xl font-bold ${
                          selectedTokenData.changePercent >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedTokenData.change}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <div className="text-sm text-red-600 flex items-center">
                        <ArrowDown className="h-4 w-4 mr-1" />
                        Support Level
                      </div>
                      <div className="text-lg font-bold text-red-700">
                        ${selectedTokenData.support.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="text-sm text-green-600 flex items-center">
                        <ArrowUp className="h-4 w-4 mr-1" />
                        Resistance Level
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        ${selectedTokenData.resistance.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-sm text-blue-600">24h Volume</div>
                      <div className="text-lg font-bold text-blue-700">
                        {selectedTokenData.volume24h}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="text-sm text-purple-600">Market Cap</div>
                      <div className="text-lg font-bold text-purple-700">
                        {selectedTokenData.marketCap}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className={`rounded-lg p-4 border-2 ${getActionColor(
                      tradingSuggestion.action
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        <span className="font-bold text-lg uppercase">
                          {tradingSuggestion.action}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {tradingSuggestion.confidence}% Confidence
                      </div>
                    </div>
                    <div className="text-sm mb-3">
                      {tradingSuggestion.reasoning}
                    </div>
                    <div className="text-xs text-gray-600">
                      Timeframe: {tradingSuggestion.timeframe}
                    </div>
                  </div>

                  {tradingSuggestion.action !== "hold" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="text-sm text-blue-600">
                          Price Target
                        </div>
                        <div className="text-lg font-bold text-blue-700">
                          ${tradingSuggestion.priceTarget.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                        <div className="text-sm text-yellow-600">Stop Loss</div>
                        <div className="text-lg font-bold text-yellow-700">
                          ${tradingSuggestion.stopLoss.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-3">
            {(["all", "positive", "negative", "trending"] as const).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleNewsFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    newsFilter === filter
                      ? `${
                          filter === "positive"
                            ? "bg-green-600"
                            : filter === "negative"
                            ? "bg-red-600"
                            : filter === "trending"
                            ? "bg-blue-600"
                            : "bg-purple-600"
                        } text-white shadow-lg`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter === "all" ? "All News" : filter}
                </button>
              )
            )}
          </div>
        </section>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading live data...</span>
          </div>
        )}

        {/* News Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Latest {selectedTokenData?.symbol || "Crypto"} News
            </h2>
            <div className="text-sm text-gray-500">
              {filteredNews.length} articles found
            </div>
          </div>

          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:bg-gray-50 transition-all group shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {news.title}
                  </h3>
                  {news.trending && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                      Trending
                    </span>
                  )}
                </div>
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </a>
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                {news.summary}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <time className="text-gray-500">{news.time}</time>
                  </div>
                  <div className="text-sm text-gray-500">via {news.source}</div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getSentimentColor(
                      news.sentiment
                    )}`}
                  >
                    {news.sentiment}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getRelevanceColor(
                      news.relevance
                    )}`}
                  >
                    {news.relevance}% relevant
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Live Data Notice */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-white rounded-full px-4 py-2 shadow-sm border">
            <div
              className={`h-2 w-2 rounded-full ${
                isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            ></div>
            <span>
              {isLive
                ? "Live data updates every 30 seconds"
                : "Reconnecting to live data feed..."}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenNewsApp;
