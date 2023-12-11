const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5013;

app.use(cors());

// Endpoint to get Kraken Bitcoin price in USD
app.get("/kraken-price", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.kraken.com/0/public/Depth?pair=XBTUSD"
    );
    const asks = response.data.result.XXBTZUSD.asks;
    const krakenPrice = parseFloat(asks[0][0]); // Using the first ask price
    res.json({ krakenPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Kraken Server Error" });
  }
});

// Endpoint to get Luno Bitcoin price in ZAR
app.get("/luno-price", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.luno.com/api/1/tickers?pair=XBTZAR"
    );
    const lunoPrice = parseFloat(response.data.tickers[0].bid); // Using the bid price
    res.json({ lunoPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Luno Server Error" });
  }
});

// Endpoint to calculate arbitrage rate

app.get("/arbitrage-rate", async (req, res) => {
  try {
    // Fetch Kraken and Luno prices
    const krakenResponse = await axios.get(
      "https://api.kraken.com/0/public/Depth?pair=XBTUSD"
    );
    const lunoResponse = await axios.get(
      "https://api.luno.com/api/1/tickers?pair=XBTZAR"
    );

    console.log("Kraken Response:", krakenResponse.data);
    console.log("Luno Response:", lunoResponse.data);

    // Calculate Kraken USD price and Luno ZAR price
    const krakenUsdPrice = parseFloat(
      krakenResponse.data.result.XXBTZUSD.asks[0][0]
    );
    const lunoZarPrice = parseFloat(lunoResponse.data.tickers[0].bid);

    // Convert 1 USD to ZAR using the provided API
    const usdToZarResponse = await axios.get(
      "https://api.freecurrencyapi.com/v1/latest",
      {
        params: {
          apikey: "fca_live_QsbQ2u6bbNWeoHG7EuI5Q6cTC178VoCStjJKWtYV",
          base_currency: "USD",
          currencies: "ZAR",
        },
      }
    );

    console.log("USD to ZAR Response:", usdToZarResponse.data);

    // Extract the USD to ZAR exchange rate from the API response
    const usdToZarRate = parseFloat(usdToZarResponse.data.data.ZAR);

    // Convert Kraken USD price to ZAR using the exchange rate
    const krakenZarPrice = krakenUsdPrice * usdToZarRate;

    // Calculate the arbitrage rate
    const difference = lunoZarPrice - krakenZarPrice;
    console.log(difference);
    const arbitragePercentage = difference / lunoZarPrice;
    const arbitrageRate = arbitragePercentage * 100;

    res.json({ arbitrageRate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Reference on the formula being used above
// 1. Get US bitcoin price (Kraken)
// 2. Get USD:ZAR rate
// 3. Multiply USD bitcoin price by ZAR USD rate
// 4. Get local bitcoin price (Luno)
// 5. Subtract converted ZAR USD bitcoin price from local bitcoin price
// 6. Take that difference, which is in ZAR and divide it by the converted ZAR USD bitcoin price
