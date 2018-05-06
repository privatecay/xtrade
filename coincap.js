var CoinMarketCap = require("node-coinmarketcap");
var coinmarketcap = new CoinMarketCap();

var rule = { baseSymbol: "OPEN.BTC", sellSymbol: "USD" };

async function coincap(rule,callback){
    let result = 0;
    var baseAsset = rule.baseSymbol.split('.')[1];
    var sellAsset = rule.sellSymbol.split('.')[1];

    coinmarketcap.multi(coins => {
        if (rule.baseSymbol.includes('.') && rule.sellSymbol.includes('.')) {
            baseAssetPrice = coins.get(baseAsset).price_usd;
            sellAssetPrice = coins.get(sellAsset).price_usd;
            result = baseAssetPrice / sellAssetPrice;
        } else if (rule.baseSymbol.includes('.') && rule.sellSymbol == 'USD'){
            result = coins.get(baseAsset).price_usd;
        } else {
            result = undefined
        }
        callback(result);
    });
}

coincap(rule, center => {
    rule.center = center;
    console.log(rule.center);
})

