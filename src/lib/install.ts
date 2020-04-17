import {JogooClient} from "./client";

export class JogooInstall {

    /** @var JogooClient */
    client:JogooClient;

    constructor(client: JogooClient) {
        this.client = client;
    }

    async do() {
        try {
            await this.client.beginTransaction();

            if (this.client.dbType === 'postgres') {
                const installSQL = `CREATE TABLE jogoo_ratings(member_id INTEGER,product_id INTEGER,category INTEGER,rating FLOAT,ts TIMESTAMP);
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
CREATE INDEX jogoo_links_category ON jogoo_links(category);`;
                await this.client.query(installSQL);
            } else if (this.client.dbType === 'mariadb' || this.client.dbType === 'mysql') {
                await this.client.query('CREATE TABLE jogoo_ratings(member_id INT NOT NULL,product_id INT NOT NULL,category INT NOT NULL,rating FLOAT NOT NULL,ts TIMESTAMP);');
                await this.client.query('CREATE INDEX jogoo_ratings_mix ON jogoo_ratings (member_id);');
                await this.client.query('CREATE INDEX jogoo_ratings_pix ON jogoo_ratings (product_id);');
                await this.client.query('CREATE UNIQUE INDEX jogoo_ratings_mpix ON jogoo_ratings (member_id,product_id,category);');
                await this.client.query('CREATE TABLE jogoo_ads(ad_id INT NOT NULL,category INT NOT NULL,mini INT NOT NULL,KEY ad_id(ad_id));');
                await this.client.query('CREATE TABLE jogoo_ads_products(ad_id INT NOT NULL,category INT NOT NULL,product_id INT NOT NULL,KEY ad_id(ad_id),KEY category(category));');
                await this.client.query('CREATE TABLE jogoo_links(item_id1 INT NOT NULL,item_id2 INT NOT NULL,category INT NOT NULL,cnt INT,diff_slope FLOAT);');
                await this.client.query('CREATE INDEX jogoo_links_i1ix ON jogoo_links (item_id1);');
                await this.client.query('CREATE INDEX jogoo_links_i2ix ON jogoo_links (item_id2);');
                await this.client.query('CREATE UNIQUE INDEX jogoo_links_ix ON jogoo_links (item_id1,item_id2,category);');
            }

            await this.client.commit();
            console.log('Jogoo installation is complete. Thank you for choosing the Jogoo.');
        } catch (err) {
            await this.client.rollback();
            console.log(err.stack);
        }
    }

}