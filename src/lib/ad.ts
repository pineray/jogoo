import { JogooClient } from "./client";
import { JOGOO_RATING_THRESHOLD } from "./config";

export class JogooAd {

    /** @var JogooClient */
    client:JogooClient;

    constructor(client: JogooClient) {
        this.client = client;
    }

    /**
     * Record an ad info.
     * @param {number} adId
     * @param {number} mini
     * @param {Array<number>} products
     * @param {number} opt_category
     */
    async recordAd(adId:number, mini:number, products:Array<number>, opt_category:number = 1) {
        const selectQuery = 'SELECT mini FROM jogoo_ads WHERE ad_id = $1::integer AND category = $2::integer ';
        const selectArgs = [adId, opt_category];

        let recordQuery, recordArgs;
        await this.client.query(selectQuery, selectArgs).then(async (res) => {
            if (res.rows.length > 0) {
                recordQuery = 'UPDATE jogoo_ads SET mini = $1::integer WHERE ad_id = $2::integer AND category = $3::integer';
                recordArgs = [mini, adId, opt_category];
            } else {
                recordQuery = 'INSERT INTO jogoo_ads(ad_id, category, mini) VALUES ($1::integer, $2::integer, $3::integer)';
                recordArgs = [adId, opt_category, mini];
            }
            await this.client.query(recordQuery, recordArgs);
        });

        const deleteQuery = 'DELETE FROM jogoo_ads_products WHERE ad_id = $1::integer AND category = $2::integer';
        const deleteArgs = [adId, opt_category];
        await this.client.query(deleteQuery, deleteArgs);

        await Promise.all(products.map(async product => await this.recordProduct(adId, product, opt_category)));
    }

    /**
     * Record a product to an ad.
     * @param {number} adId
     * @param {number} productId
     * @param {number} opt_category
     */
    async recordProduct(adId:number, productId:number, opt_category:number = 1) {
        const insertQuery = 'INSERT INTO jogoo_ads_products(ad_id, category, product_id) ' +
            'VALUES($1::integer, $2::integer, $3::integer)';
        const insertArgs = [adId, opt_category, productId];

        await this.client.query(insertQuery, insertArgs);
    }

    /**
     * Delete an ad.
     * @param {number} adId
     * @param {number} opt_category
     */
    async deleteAd(adId:number, opt_category:number = 1) {
        const args = [adId, opt_category];

        const productQuery = 'DELETE FROM jogoo_ads_products WHERE ad_id = $1::integer AND category = $2::integer';
        await this.client.query(productQuery, args);

        const adQuery = 'DELETE FROM jogoo_ads WHERE ad_id = $1::integer AND category = $2::integer';
        await this.client.query(adQuery, args);
    }

    /**
     * Get an ad info.
     * @param {number} adId
     * @param {number} opt_category
     */
    async getAd(adId:number, opt_category:number = 1) {
        const args = [adId, opt_category];
        let ret;

        const adQuery = 'SELECT mini FROM jogoo_ads WHERE ad_id = $1::integer AND category = $2::integer';
        await this.client.query(adQuery, args).then(async (res) => {
            if (res.rows.length != 1) {
                ret = {mini: 0, products: []};
            } else {
                let products:Array<number> = [];
                const productQuery = 'SELECT product_id FROM jogoo_ads_products WHERE ad_id = $1::integer AND category = $2::integer';
                await this.client.query(productQuery, args).then((res) => {
                    res.rows.forEach((row) => {
                        products.push(row.product_id);
                    });
                });
                ret = {mini: res.rows[0].mini, products: products};
            }
        });

        return ret;
    }

    /**
     * Get ads targeting a specified member.
     * @param memberId
     * @param opt_category
     */
    async getTargetedAds(memberId:number, opt_category:number = 1) {
        const query = 'SELECT a.ad_id, a.mini FROM jogoo_ads a ' +
            'LEFT JOIN jogoo_ads_products p ON p.category = a.category AND a.ad_id = p.ad_id ' +
            'LEFT JOIN jogoo_ratings r ON a.category = r.category AND p.product_id = r.product_id ' +
            'WHERE r.member_id = $1::integer AND r.rating >= $2::float AND r.category = $3::integer ' +
            'GROUP BY a.ad_id, a.mini HAVING COUNT(p.product_id) >= a.mini';
        const args = [memberId, JOGOO_RATING_THRESHOLD, opt_category];
        let ads:Array<number> = [];

        await this.client.query(query, args).then((res) => {
            res.rows.forEach((row) => {
                ads.push(row.ad_id);
            });
        });
        return ads;
    }

}