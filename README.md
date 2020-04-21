# Jogoo
Jogoo is collaborative filtering library. This is porting Vogoo PHP Lib to node.js.

[![npm version](https://badgen.net/npm/v/jogoo)](https://www.npmjs.com/package/jogoo)

## Installation
```sh
npm install jogoo

# And one of the following:
npm install pg
npm install mysql2
```

### Run install script
```javascript
const { JogooClient, JogooInstall } = require('jogoo');

(async () => {
    let dbConfig = {
        dialect: 'YOUR_DATABASE_TYPE', // 'postgres', 'mysql' or 'mariadb'
        user: 'YOUR_DATABASE_USER',
        host: 'YOUR_DATABASE_HOST',
        database: 'YOUR_DATABASE_NAME',
        password: 'YOUR_DATABASE_PASS'
    };
    let jogooClient = new JogooClient(dbConfig);
    await jogooClient.connect();
    const jogooInstall = new JogooInstall(jogooClient);
    await jogooInstall.do();
    jogooClient.end();
})();
```

### Dotenv available
If you use Dotenv, you can write settings in the .env file.
```javascript
JOGOO_DB_TYPE = YOUR_DATABASE_TYPE
JOGOO_DB_USER = YOUR_DATABASE_USER
JOGOO_DB_HOST = YOUR_DATABASE_HOST
JOGOO_DB_NAME = YOUR_DATABASE_NAME
JOGOO_DB_AUTH = YOUR_DATABASE_PASS
```
That way, no arguments are needed at creating the client.
```javascript
let jogooClient = new JogooClient();
```

## Set Ratings
```javascript
/**
 * Set a rating manually.
 * @param {number} memberId
 * @param {number} productId
 * @param {number} rating
 * @param {number} opt_category
 * @return {Promise<boolean>}
 */
Jogoo.setRating(memberId, productId, rating, opt_category = 1);

/**
 * Set a pre-defined rating.
 * @param {number} memberId
 * @param {number} productId
 * @param {boolean} opt_purchase
 * @param {number} opt_category
 * @return {Promise<boolean>}
 */
Jogoo.automaticRating(memberId, productId, opt_purchase = false, opt_category = 1);
```

## Item-based Collaborative Filtering
2 item-based collaborative filtering engines are available in Jogoo.
* The first engine works in the way: "If you liked the following items, you should also like ...".
* The second engine is based on [Daniel Lemire](https://lemire.me/ "Daniel Lemire's blog")'s Slope-one algorithm. It can predict the rating you would give to a specific item or the ratings for all items you have not rated yet.

These 2 engines are quite fast but require some pre-computation. To do this we included 2 batch scripts (one for each engine) that pre-compute all the data needed to make recommendation.

These 2 engines can't be run in parallel. They share the same database tables and creating data for one of the engines overwrites all previous data created for the other engine.

## Batch pre-computation

### For first engine
```javascript
const { JogooAggregateLinks, JogooClient } = require('jogoo');

(async () => {
    let jogooClient = new JogooClient();
    await jogooClient.connect();
    const jogooAggregateLinks = new JogooAggregateLinks(jogooClient);
    await jogooAggregateLinks.do();
    jogooClient.end();
})();
```
### For second engine
```javascript
const { JogooAggregateSlope, JogooClient } = require('jogoo');

(async () => {
    let jogooClient = new JogooClient();
    await jogooClient.connect();
    const jogooAggregateSlope = new JogooAggregateSlope(jogooClient);
    await jogooAggregateSlope.do();
    jogooClient.end();
})();
```

## Get Recommendation

```javascript
/**
 * For first engine.
 * Get linked items.
 * @param {number} productId
 * @param {number} opt_category
 * @param {boolean|object} opt_filter
 * @param {number} opt_max
 * @return {Promise<Array>}
 */
JogooItem.getLinkedItems(productId, opt_category = 1, opt_filter = false, opt_max = 1000000);

/**
 * For second engine.
 * Get sloped items.
 * @param {number} productId
 * @param {number} opt_minCount
 * @param {number} opt_category
 * @param {boolean|object} opt_filter
 * @param {number} opt_max
 * @return {Promise<Array>}
 */
JogooItem.getSlopedItems(productId, opt_minCount = 1, opt_category = 1, opt_filter = false, opt_max = 1000000);
```