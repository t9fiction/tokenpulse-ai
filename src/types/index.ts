// Enhanced types
interface Token {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: number;
  priceHistory: number[];
  volume24h: string;
  marketCap: string;
  support: number;
  resistance: number;
  high24h: number;
  low24h: number;
  lastUpdated: Date;
}

interface CryptoAPIResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
  summary: string;
  url: string;
  trending: boolean;
  publishedAt: Date;
}

interface TradingSuggestion {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  priceTarget: number;
  stopLoss: number;
  reasoning: string;
  timeframe: string;
}

type NewsFilter = 'all' | 'positive' | 'negative' | 'trending';