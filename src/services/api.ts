export interface StockData {
  date: string;
  price: number;
}

export interface StockSymbol {
  symbol: string;
  name: string;
}

interface MoexSecurity {
  SECID: string;
  SHORTNAME: string;
}

class ApiService {
  private readonly baseUrl = 'https://iss.moex.com';

  async searchStocks(query: string = ''): Promise<StockSymbol[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/iss/engines/stock/markets/shares/boardgroups/57/securities.json?iss.meta=off&iss.json=extended&securities.columns=SECID,SHORTNAME`
      );
      const data = await response.json();
      
      if (!data[1]?.securities) {
        return [];
      }

      const stocks = data[1].securities.map((stock: MoexSecurity) => ({
        symbol: stock.SECID,
        name: stock.SHORTNAME
      }));

      if (query) {
        const lowerQuery = query.toLowerCase();
        return stocks.filter((stock: StockSymbol) => 
          stock.symbol.toLowerCase().includes(lowerQuery) || 
          stock.name.toLowerCase().includes(lowerQuery)
        );
      }

      return stocks;
    } catch (error) {
      console.error('Error fetching stocks:', error);
      return [];
    }
  }

  async getStockData(symbol: string): Promise<StockData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/iss/engines/stock/markets/shares/securities/${symbol}/candles.json?` +
        `iss.meta=off&iss.only=candles&candles.columns=begin,close&` +
        `interval=10&limit=72&` +
        `iss.reverse=true`
      );
      const data = await response.json();
      
      if (!data.candles?.data) {
        return [];
      }

      const now = new Date();
      return data.candles.data
        .map((candle: [string, number]) => ({
          date: candle[0],
          price: candle[1]
        }))
        .filter((item: StockData) => new Date(item.date) <= now)
        .reverse();
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return [];
    }
  }
}

export const apiService = new ApiService(); 