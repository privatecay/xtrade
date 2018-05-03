const Bitshares = require('btsdex');
var config = require('./config');
let count = 0;

// Market specific settings
baseSymbol = 'GDEX.EOS';
sellSymbol = 'OPEN.EOS';
qty = 50;
center = 1;
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
    let baseID = (await Bitshares.assets[baseSymbol]).id;
    let sellID = (await Bitshares.assets[sellSymbol]).id;

    console.log('========================================');
    console.log('Market: '+sellSymbol+'/'+baseSymbol);

    // Discover the market
    let market = await Bitshares.db.get_ticker(baseSymbol, sellSymbol);

    spread.value = market.lowest_ask - market.highest_bid;
    spread.percentage = spread.value / market.latest;
    
    // Calculate the market center price unless the user specifies it
    if (!center) {
        center = (parseFloat(market.lowest_ask) + parseFloat(market.highest_bid)) / 2;
    }
    
    // Cancel Orders
    async function cancelOrders() {

    }

    // Only post new orders if all previous orders have been filled
    async function postOrders(){
        count++;
        // orders.map((order, index, orders) => {
        //     console.log(order);
        //     bot.cancelOrder(order.id);
        //     console.log('Cancel Order:',order.id);
        // })

        // Calculate prices for buy and sell orders
        let sellOrder = center*(1+(spread.target/2));
        let buyOrder = center/(1+(spread.target/2));
        
        // Execute buy/sell operations
        bot.sell(sellSymbol, baseSymbol, qty, sellOrder, fill_or_kill = false, expire = "2020-02-02T02:02:02");
        bot.buy(sellSymbol, baseSymbol, qty, buyOrder, fill_or_kill = false, expire = "2020-02-02T02:02:02");
    

        console.log('Trial: '+count)
        console.log('Spread: '+round(spread.percentage * 100, 2)+'% '+spread.value);
        console.log('Latest: '+market.latest);
        console.log('Sell Order: '+sellOrder);
        console.log('Average: '+center);
        console.log('Buy Order: '+buyOrder);
        console.log('========================================');

        console.log(market);
    }

    // When not posting orders, give feedback for the current orders
    async function info() {

        // Filter to calculate qty for each asset
        function getAssetBalances(value) {
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

    // See if there are any current orders on this market pair
    let orders = await bot.orders();

    if (orders.length > 0) {
        orders.map((o, index, orders) => {

            // This logic checks to see if there are any orders are still in place for the current market
            // If so, just get info, otherwise postOrders() below
            if ((o.sell_price.base.asset_id  == baseID || o.sell_price.base.asset_id  == sellID) &&
            (o.sell_price.quote.asset_id  == baseID || o.sell_price.quote.asset_id  == sellID)
            ) {
                info();
            } else {
                postOrders();
            }
        })
    } else {
        postOrders();
    }


}

Bitshares.subscribe('connected', startAfterConnected);
Bitshares.connect();

setInterval(startAfterConnected,frequency*1000);