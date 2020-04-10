const { Client } = require('pg');
const { JOGOO_DB_CONFIG } = require('./config');
const client = new Client(JOGOO_DB_CONFIG);
client.connect();

const installSQL = `BEGIN;
CREATE TABLE jogoo_ratings(member_id INTEGER,product_id INTEGER,category INTEGER,rating FLOAT,ts TIMESTAMP);
CREATE INDEX jogoo_ratings_member_id_index ON jogoo_ratings(member_id);
CREATE INDEX jogoo_ratings_product_id_index ON jogoo_ratings(product_id);
CREATE INDEX jogoo_ratings_category_index ON jogoo_ratings(category);
CREATE TABLE jogoo_ads(ad_id INTEGER,category INTEGER,mini INTEGER);
CREATE INDEX jogoo_ads_ad_id_index ON jogoo_ads(ad_id);
CREATE TABLE jogoo_ads_products(ad_id INTEGER,category INTEGER,product_id INTEGER);
CREATE INDEX jogoo_ads_products_ad_id_index ON jogoo_ads_products(ad_id);
CREATE INDEX jogoo_ads_products_category_index ON jogoo_ads_products(category);
CREATE TABLE jogoo_links(item_id1 INTEGER,item_id2 INTEGER,category INTEGER,cnt INT,diff_slope FLOAT);
CREATE INDEX jogoo_links_item_id1_index ON jogoo_links(item_id1);
CREATE INDEX jogoo_links_item_id2_index ON jogoo_links(item_id2);
CREATE INDEX jogoo_links_category ON jogoo_links(category);
COMMIT;`;

client.query(installSQL, (err, res) => {
    console.log(err ? err.stack : 'Jogoo installation is complete. Thank you for choosing the Jogoo.');
    client.end();
});