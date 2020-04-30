import {JogooClient} from "./client";
import {JOGOO_RATING_THRESHOLD} from "./config";

export class JogooStatistic {

    /** @var {JogooClient} */
    client:JogooClient;

    /** @var {number} */
    threshold:number = JOGOO_RATING_THRESHOLD;

    /**
     * @param {JogooClient} client
     * @param {Object} options
     */
    constructor(client:JogooClient, options?:{[key: string]: string|number}) {
        this.client = client;
        if (options !== undefined && options.hasOwnProperty('threshold')) {
            this.threshold = Number(options.threshold);
        }
    }

    /**
     * Count members that already inputted ratings.
     * @param {number} opt_category
     */
    async countMembers(opt_category:number = 1) {
        const query = `SELECT COUNT(DISTINCT member_id) cnt FROM jogoo_ratings WHERE category = ${opt_category}`;
        let cnt = 0;
        await this.client.query(query).then((res) => {
            cnt = Number(res[0].cnt);
        });
        return cnt;
    }

    /**
     * Count products that already be rated.
     * @param {number} opt_category
     */
    async countProducts(opt_category:number = 1) {
        const query = `SELECT COUNT(DISTINCT product_id) cnt FROM jogoo_ratings WHERE category = ${opt_category}`;
        let cnt = 0;
        await this.client.query(query).then((res) => {
            cnt = Number(res[0].cnt);
        });
        return cnt;
    }

    /**
     * Get a distribution map of ratings.
     * @param {number} opt_granularity
     * @param {number} opt_category
     */
    async getDistribution(opt_granularity:number = 10, opt_category:number = 1) {
        const query = `SELECT ROUND(rating * ${opt_granularity}) val, count(*) cnt FROM jogoo_ratings 
WHERE category = ${opt_category} AND rating >= 0.0 GROUP BY val ORDER BY val DESC`;
        return await this.client.query(query);
    }

    /**
     * Get a distribution map of ratings inputted by a specified member.
     * @param {number} memberId
     * @param {number} opt_granularity
     * @param {number} opt_category
     */
    async getDistributionMember(memberId:number, opt_granularity:number = 10, opt_category:number = 1) {
        const query = `SELECT ROUND(rating * ${opt_granularity}) val, count(*) cnt FROM jogoo_ratings 
WHERE member_id = ${memberId} AND category = ${opt_category} AND rating >= 0.0 GROUP BY val ORDER BY val DESC`;
        return await this.client.query(query);
    }

    /**
     * Get a distribution map of ratings inputted to a specified product.
     * @param {number} productId
     * @param {number} opt_granularity
     * @param {number} opt_category
     */
    async getDistributionProduct(productId:number, opt_granularity:number = 10, opt_category:number = 1) {
        const query = `SELECT ROUND(rating * ${opt_granularity}) val, count(*) cnt FROM jogoo_ratings 
WHERE product_id = ${productId} AND category = ${opt_category} AND rating >= 0.0 GROUP BY val ORDER BY val DESC`;
        return await this.client.query(query);
    }

    /**
     * Get the ranking of the most rated product.
     * @param {number} opt_max
     * @param {number} opt_category
     * @param {boolean|Object} opt_filter
     */
    async getProductRanking(opt_max:number = 10, opt_category:number = 1, opt_filter:boolean|{[key: number]: boolean} = false) {
        const query = `SELECT product_id, count(*) cnt FROM jogoo_ratings
WHERE category = ${opt_category} AND rating >= ${this.threshold} GROUP BY product_id ORDER BY cnt DESC`;
        return await this.client.query(query)
            .then((res) => {
                let items: Array<{ [key: string]: string|number }> = [];
                let i:number = 0;
                let rank:number = 1;
                let previous:number = 0;
                res.some((item) => {
                    if (!opt_filter || opt_filter[item.product_id]) {
                        item.cnt = Number(item.cnt);
                        if (item.cnt === previous) {
                            item.rank = rank;
                        } else {
                            rank = item.rank = i + 1;
                            previous = item.cnt;
                        }
                        if (rank >= opt_max) {
                            return true;
                        }
                        items.push(item);
                        i++;
                    }
                });
                return items;
            })
            .catch((err) => {
                throw err;
            });
    }

    /**
     * Get the member with the highest number of ratings.
     * @param {number} opt_max
     * @param {number} opt_category
     * @param {boolean|Object} opt_filter
     */
    async getMemberRanking(opt_max:number = 10, opt_category:number = 1, opt_filter:boolean|{[key: number]: boolean} = false) {
        const query = `SELECT member_id, count(*) cnt FROM jogoo_ratings
WHERE category = ${opt_category} AND rating >= ${this.threshold} GROUP BY member_id ORDER BY cnt DESC`;
        return await this.client.query(query)
            .then((res) => {
                let items: Array<{ [key: string]: string|number }> = [];
                let i:number = 0;
                let rank:number = 1;
                let previous:number = 0;
                res.some((item) => {
                    if (!opt_filter || opt_filter[item.member_id]) {
                        item.cnt = Number(item.cnt);
                        if (item.cnt === previous) {
                            item.rank = rank;
                        } else {
                            rank = item.rank = i + 1;
                            previous = item.cnt;
                        }
                        if (rank >= opt_max) {
                            return true;
                        }
                        items.push(item);
                        i++;
                    }
                });
                return items;
            })
            .catch((err) => {
                throw err;
            });
    }

}