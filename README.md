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

## Data Types
There are 4 types of input data in Jogoo:
* _Member ID_ : the IDs you use on your website to identify your users/members. Jogoo uses numbers as IDs. Therefore, if you do not use integers to identify your members, make sure to create a table linking your user IDs and the numeric IDs you will create for them in Jogoo.
* _Products IDs_ : IDs for objects/items rated by the members. These IDs are integers.
* _Ratings_ : ratings in Jogoo are floating-point numbers in the range 0.0 to 1.0 . This choice allows Jogoo to use a generic algorithm that can manage all 'real ratings' ranges in the same way.  
Hence, before entering any rating in Jogoo, remember to divide it by the maximum rating value that can be given to a product on your website, e.g. if a member rated a product 7 over 10, the rating entered in Jogoo should be 7/10 = 0.7.
* _Categories_ : categories are groups of products. Their goal is to allow you to store ratings for different types of product in a single database. Categories IDs are integers. Please note that you can assign non successive numbers to category IDs. Recommendations and item-based functions don't work across categories.

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
```
This function adds or changes the rating given by member \{memberId\} to product \{productId\}. \{rating\} must be in the range \[0..1\] as explained above.  
If the rating doesn't exist in the DB, it is added. Otherwise it is changed to the new \{rating\} value.  
This function returns true on success, false otherwise.
```javascript
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
Many websites don't ask their users to rate items. But the fact that a user looks at the page of an item serveral times, or that he buys this item can be used to create a "virtual" rating. This rating can then be used to make recommendations based on the view/purchase information that is now associated to the item.

The goal of this function is to create this virtual rating. It automatically adds or updates the rating for product \{productId\} depending on the \{opt_purchase\} flag information.  
\{opt_purchase\} flag set to false is interpreted as a "view" of the product page. You should call this function everytime the user looks at the item's page: the greater the number of "views", the higher the rating gets for this member/product.  
Calling this function with the flag set to true means that the user has bought the product.

This function returns true on success, false otherwise.
```javascript
/**
 * Set not-interested.
 * @param {number} memberId
 * @param {number} productId
 * @param {number} opt_category
 * @return {Promise<boolean>}
 */
Jogoo.setNotInterested(memberId, productId, opt_category = 1);
```
Call this function to specify that member \{memberId\} is not interested in product \{productId\} and that it should not be recommended to him even if it seems to match his tastes.  
A member can't be at the same time "not interested" in a product and have a rating for this product. If you call this function when a rating already exists for this member/product, the rating will be erased.  
This function returns true on success, false otherwise.

## Item-based Collaborative Filtering
2 item-based collaborative filtering engines are available in Jogoo.
* The first engine works in the way: "If you liked the following items, you should also like ...".
* The second engine is based on [Daniel Lemire](https://lemire.me/ "Daniel Lemire's blog")'s Slope-one algorithm. It can predict the rating you would give to a specific item or the ratings for all items you have not rated yet.

These 2 engines are quite fast but require some pre-computation. To do this we included 2 batch scripts (one for each engine) that pre-compute all the data needed to make recommendation.

These 2 engines can't be run in parallel. They share the same database tables and creating data for one of the engines overwrites all previous data created for the other engine.

### Real time or batch pre-computation
As explained above, every rating set by a member generates new data for the item-based CF engines. This data is linked to all previous ratings given by the member. Hence, updating this item-based CF data in real time can cause the system to slow down dramatically if a member has rated many items. To avoid this kind of issues, we added 2 batch scripts that you can run daily (or more often if you use Jogoo) to compute the data. Nervertheless, some hosting services set a very low timeout limit for script execution, and you might not be able to run the batch scripts on these hosts.

#### Activating real-time computation
To activate real-time computation, edit the .env file. Set the JOGOO_LINKS_REALTIME_LINK constant to true to get real-time updates for the first engine. Set JOGOO_LINKS_REALTIME_SLOPE to true to get real-tie updates for the second engine.

Otherwise, it is possible to activate real-time computation by passing the options at creating Jogoo instance.
```javascript
// For first engine.
let jogoo = Jogoo(jogooClient, {realtimeLink:true});
// For second engine.
let jogoo = Jogoo(jogooClient, {realtimeSlope:true});
```
#### Batch pre-computation

##### For first engine
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
##### For second engine
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

## Using the first item-based engine
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
```
This function returns the array of items "linked" to item \{productId\}. This allowing you to display recommendations like: people who liked item X also liked items Y and Z, without having any knowledge of the current visitor/member's tastes.  
Each column of the returned array is a product ID. The array is sorted from the most linked item to \{productId\} to the least linked. On failure, false is returned.  
This function can be called for both members and visitors.

## Using the second item-based engine
```javascript
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
This function returns the array of items linked to item \{productId\} using the Slope One agorithm. It is similar to the get_linked_items function described above and allows you to display recommendations like: people who liked item X also liked items Y and Z.

However, this function is more accurate in that it returns the average rating difference between item \{productId\} and each returned item.

Each column of the returned array is an array containing the product ID (index 0 or key 'product_id') and the average rating difference (index 1 or key 'diff') between this item and \{productId\} (positive rating means the returned item is better rated in average than \{productId\}). The array is sorted in descending rating difference order.  
The \{opt_minCount\} parameter allows you to get only items that have been linked at least \{opt_minCount\} times to \{productId\} (ie the returned item and \{productId\} both appear in the rated items lists of \{opt_minCount\} users).  
On failure, false is returned.  
You can use the \{opt_max\} parameter to limit the number of returned values.  
This function can be called for both members and visitors. 