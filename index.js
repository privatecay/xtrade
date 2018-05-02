const Bitshares = require('btsdex');
var config = require('./config');
let count = 0;

// Market specific settings
baseSymbol = 'GDEX.EOS';
sellSymbol = 'OPEN.EOS';
qty = 50;
average = 1;
target = 0.008;
frequency = 15;


function round(number, precision) {
    var shift = function (number, precision, reverseShift) {
      if (reverseShift) {
        precision = -precision;
      }  
      var numArray = ("" + number).split("e");
      return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
    };
    return shift(Math.round(shift(number, precision, false)), precision, true);
  }

Bitshares.init('wss://api.btsxchng.com');


async function startAfterConnected() {

    let bot = new Bitshares(config.ACCOUNT,config.KEY);
    let spread = { value: 0, percentage: 0, target: target };

    console.log('========================================');
    console.log('Market: '+sellSymbol+'/'+baseSymbol);

    // Discover the market
    // This function references a try/catch handler
    // try {
        let market = await Bitshares.db.get_ticker(baseSymbol, sellSymbol);
    // } catch(e) {
    //     return 'Unable to get market';
    // }

    spread.value = market.lowest_ask - market.highest_bid;
    spread.percentage = spread.value / market.latest;
    
    // Calculate the market average price unless the user specifies it
    if (!average) {
        average = (parseFloat(market.lowest_ask) + parseFloat(market.highest_bid)) / 2;
    }

    // Identify current orders and cancel them
    let orders = await bot.orders();

    // Only post new orders if all previous orders have been filled
    if (orders.length === 0) {
        count++;
        orders.map((order, index, orders) => {
            console.log(order);
            bot.cancelOrder(order.id);
            console.log('Cancel Order:',order.id);
        })

        // Calculate prices for buy and sell orders
        let sellOrder = average*(1+(spread.target/2));
        let buyOrder = average/(1+(spread.target/2));
        
        // Execute buy/sell operations
        bot.sell(sellSymbol, baseSymbol, qty, sellOrder, fill_or_kill = false, expire = "2020-02-02T02:02:02");
        bot.buy(sellSymbol, baseSymbol, qty, buyOrder, fill_or_kill = false, expire = "2020-02-02T02:02:02");
    

        console.log('Trial: '+count)
        console.log('Spread: '+round(spread.percentage * 100, 2)+'% '+spread.value);
        console.log('Latest: '+market.latest);
        console.log('Sell Order: '+sellOrder);
        console.log('Average: '+average);
        console.log('Buy Order: '+buyOrder);
        console.log('========================================');

        console.log(market);
    } else {
        // console.log('Asset Balances', assets);
        // Calculate qty for each asset
        function getAssetBalances(value) {
            // console.log(value);

            return value.asset.symbol == sellSymbol || value.asset.symbol == baseSymbol

        }

        let balances = await bot.balances();
        var assets = balances.filter(getAssetBalances);
        assets.map((asset, index, assets) => {
            console.log(asset.amount * Math.pow(10,-asset.asset.precision)+' '+asset.asset.symbol);
        });


        console.log('Orders have not yet been filled');
        console.log('========================================');


    }

}

Bitshares.subscribe('connected', startAfterConnected);
Bitshares.connect();

setInterval(startAfterConnected,frequency*1000);