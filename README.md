## Overview

This is super beta software right now. Use at your own risk. 

**** I highly recommend you use this with an account with limited funds to limit your potential losses. ****

At this point this trading bot designed to work with the [Bitshares DEX](https://wallet.bitshares.org) isn't really capable of market discovery. In other words you can set a center point and a spread and it will offer equal trades on both sides of that spread. For this reason, it makes a lot of sense to pick a market where the two assets should have the same value like OPEN.BTC and GDEX.BTC (or countless others). In this case, the `average` value should be set to `1`. It does not place new orders until both orders are completely executed.

## Basic function

- Are there currently 0 orders for this account holder?
- If so, execute 2 trades according to the chosen `spread` on either side of the `average` value. A spread of .01 would indicate a 1% spread (.5% above the average and .5% below the average).
- Monitor these orders every `frequency` seconds.

## Known Bugs

- If your computer sleeps, it's likely the socket will be broken. I need logic to recover from this.
- If you don't have equal funds for both sides of the trade, the order will fail to get placed for that side of the trade.

## Instructions

```
git clone git@github.com:privatecay/xtrade.git
cd xtrade
npm i
cp config.js.template config.js
vi config.js
```

If you don't have vi, just edit config.js and replace the values with your private key and your account name for your bitshares trading account.

rules.js

This file contains an array of objects. Each object represents a particular marker that you would like to have your bot exceute trades on.
```
var rules = [
    {
        baseSymbol: 'GDEX.EOS', // Obvious
        sellSymbol: 'OPEN.EOS', // Obvious
        qty: 50,                // Number of shares to buy and sell
        center: 1,              // The center point of the market
        target: 0.008           // Update frequencey (15 seconds)
    },  
    {
        baseSymbol: 'OPEN.LTC',
        sellSymbol: 'BRIDGE.LTC',
        qty: 8,
        center: 1,
        target: 0.008
    }
]

module.exports = rules;
```

Before running, make sure you have an equal, amount of each asset. For instance, if you plan to place this on the GDEX.EOS / OPEN.EOS market and plan to trade 50 EOS, be sure you have 50 GDEX.EOS and 50 OPEN.EOS in your account. I recommend starting with a very small amount of each asset.

> Note: If your sides of the trade ever get uneven, you will need to manually even them out. Ideally, I'd like to handle this automatically in the future.

Run it
```
node index.js
```
