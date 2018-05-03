const Bitshares = require('btsdex');
var moment = require('moment');
var config = require('./config');
var rules = require('./rules');

let count = 0;

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


async function startAfterConnected(rule, callback) {
    var response = [];

    function getAssetBalances(value) {
        return value.asset.symbol == rule.sellSymbol || value.asset.symbol == rule.baseSymbol
    }

    let bot = new Bitshares(config.ACCOUNT,config.KEY);
    let spread = { value: 0, percentage: 0, target: rule.target };
    let baseID = (await Bitshares.assets[rule.baseSymbol]).id;
    let sellID = (await Bitshares.assets[rule.sellSymbol]).id;

    response.push('========================================');
    response.push(moment().format('M/D/YYYY hh:mm:SSa'));
    response.push('Market: '+rule.sellSymbol+'/'+rule.baseSymbol);

    // Discover the market
    let market = await Bitshares.db.get_ticker(rule.baseSymbol, rule.sellSymbol);

    spread.value = market.lowest_ask - market.highest_bid;
    spread.percentage = spread.value / market.latest;
    
    // Calculate the market center price unless the user specifies it
    if (!rule.center) {
        rule.center = (parseFloat(market.lowest_ask) + parseFloat(market.highest_bid)) / 2;
    }

    // Cancel Orders
    async function cancelOrders() {
        // orders.map((order, index, orders) => {
        //     console.log(order);
        //     bot.cancelOrder(order.id);
        //     console.log('Cancel Order:',order.id);
        // })
    }

    // Only post new orders if all previous orders have been filled
    async function postOrders(){
        count++;

        // Calculate prices for buy and sell orders
        let sellOrder = center*(1+(spread.target/2));
        let buyOrder = center/(1+(spread.target/2));
        
        // Execute buy/sell operations
        bot.sell(rule.sellSymbol, rule.baseSymbol, rule.qty, sellOrder, fill_or_kill = false, expire = "2020-02-02T02:02:02");
        bot.buy(rule.sellSymbol, rule.baseSymbol, rule.qty, buyOrder, fill_or_kill = false, expire = "2020-02-02T02:02:02");
    

        response.push('Trial: '+count)
        response.push('Spread: '+round(spread.percentage * 100, 2)+'% '+spread.value);
        response.push('Latest: '+market.latest);
        response.push('Sell Order: '+sellOrder);
        response.push('Average: '+center);
        response.push('Buy Order: '+buyOrder);

        response.push(market);
    }

    // When not posting orders, give feedback for the current orders
    async function info(marketOrders) {
        marketOrders.map((order, index, marketOrders) => {
            response.push('Order: '+order.id+' '+order.sell_price.base.amount);
        })
    }

    // See if there are any current orders on this market pair
    let orders = await bot.orders();

    if (orders.length > 0) {
        var marketOrders = [];
        orders.map((o, index, orders) => {
            // This logic checks to see if there are any orders are still in place for the current market
            // If so, just get info, otherwise postOrders() below
            if ((o.sell_price.base.asset_id  == baseID || o.sell_price.base.asset_id  == sellID) &&
            (o.sell_price.quote.asset_id  == baseID || o.sell_price.quote.asset_id  == sellID)
            ) {
                marketOrders.push(o);
            }
        })

        if (marketOrders.length > 0) { 
            info(marketOrders);
        } else {
            console.log('post1', rule.baseSymbol);
            // postOrders();
        }

    } else {
        console.log('post2', rule.baseSymbol);
        // postOrders();
        }

    let balances = await bot.balances();
    var assets = balances.filter(getAssetBalances);
    assets.map((asset, index, assets) => {
        response.push('Balance: '+asset.asset.symbol+' '+asset.amount * Math.pow(10,-asset.asset.precision));
    });


    callback(response);
}

async function begin(rule) {
    startAfterConnected(rule, function(res){
        console.log(res.join('\n'));
    });
}

async function loadRules() {
    rules.map((rule, index, rules) => {
        begin(rule);
    });
}

Bitshares.subscribe('connected', loadRules);
Bitshares.connect();


setInterval(loadRules,config.FREQUENCY*1000);