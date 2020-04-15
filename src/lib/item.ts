import {JogooClient} from "./client";

import { JOGOO_ITEMS_MAX_RETURN, JOGOO_RATING_THRESHOLD } from './config';

export class JogooItem {

    /** @var {JogooClient} */
    client:JogooClient;

    /**
     * @param {JogooClient} client
     */
    constructor(client: JogooClient) {
        this.client = client;
    }

    /**
     * Get linked items.
     * @param {number} productId
     * @param {number} opt_category
     * @param {boolean|object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getLinkedItems(productId:number, opt_category:number = 1, opt_filter:boolean|{[key: number]: boolean} = false, opt_max:number = JOGOO_ITEMS_MAX_RETURN) {
        const query = `SELECT item_id2 FROM jogoo_links WHERE item_id1 = ${productId} AND category = ${opt_category} ORDER BY cnt DESC`;

        return await this.client.query(query)
            .then((res) => {
                let items: Array<number> = [];
                let i = 0;
                res.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.item_id2]) {
                        items.push(Number(item.item_id2));
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
     * Get sloped items.
     * @param {number} productId
     * @param {number} opt_minCount
     * @param {number} opt_category
     * @param {boolean|object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getSlopedItems(productId:number, opt_minCount:number = 1, opt_category:number = 1, opt_filter:boolean|{[key: number]: boolean} = false, opt_max:number = JOGOO_ITEMS_MAX_RETURN) {
        const query = `SELECT item_id2 AS product_id, (diff_slope / cnt) AS diff FROM jogoo_links
WHERE item_id1 = ${productId} AND category = ${opt_category} AND cnt != 0 AND cnt >= ${opt_minCount} ORDER BY diff DESC`;

        return await this.client.query(query)
            .then((res) => {
               let items: Array<object> = [];
               let i = 0;
                // @ts-ignore
                res.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.product_id]) {
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
     * Get recommended items to a specified member.
     * @param {number} memberId
     * @param {number} opt_category
     * @param {boolean|object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getRecommendedItems(memberId:number, opt_category:number = 1, opt_filter:boolean|{[key: number]: boolean} = false, opt_max:number = JOGOO_ITEMS_MAX_RETURN) {
        const query = `SELECT l.item_id2, SUM(l.cnt * (r.rating - ${JOGOO_RATING_THRESHOLD})) AS cnter FROM jogoo_links l
LEFT JOIN jogoo_ratings r ON l.item_id1 = r.product_id AND l.category = r.category
WHERE r.member_id = ${memberId} AND r.category = ${opt_category} AND r.rating >= 0.0
GROUP BY l.item_id2 HAVING SUM(l.cnt * (r.rating - ${JOGOO_RATING_THRESHOLD})) > 0
AND l.item_id2 NOT IN (SELECT product_id FROM jogoo_ratings WHERE member_id = ${memberId} AND category = ${opt_category})
ORDER BY cnter DESC`;

        return await this.client.query(query)
            .then((res) => {
                let items: Array<number> = [];
                let i = 0;
                res.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.item_id2]) {
                        items.push(Number(item.item_id2));
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
     * Get trigger items.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} opt_category
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getTriggerItems(memberId:number, productId:number, opt_category:number = 1, opt_max:number = JOGOO_ITEMS_MAX_RETURN) {
        const query = `SELECT r.product_id FROM jogoo_ratings r LEFT JOIN jogoo_links l
ON r.product_id = l.item_id2 AND l.category = r.category
WHERE r.member_id = ${memberId} AND l.item_id1 = ${productId} AND r.category = ${opt_category} AND r.rating >= ${JOGOO_RATING_THRESHOLD} AND l.cnt > 0`;

        return await this.client.query(query)
            .then((res) => {
                let items: Array<number> = [];
                let i = 0;
                res.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    items.push(Number(item.product_id));
                    i++;
                });
                return items;
            })
            .catch((err) => {
                throw err;
            });
    }

    /**
     * Get a prediction that the member will rate a specified product.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} opt_category
     * @return {Promise<boolean|number>}
     */
    async getPredictedRate(memberId:number, productId:number, opt_category:number = 1) {
        const query = `SELECT SUM(r.rating * l.cnt - l.diff_slope) / SUM(l.cnt) AS ratio FROM jogoo_links l, jogoo_ratings r
WHERE l.item_id1 = ${productId} AND r.member_id = ${memberId} AND l.category = ${opt_category}
AND r.product_id = l.item_id2 AND r.category = l.category`;

        return await this.client.query(query)
            .then((res) => {
               if (res.length === 0 || res[0].cnter === 0) {
                   return false;
               } else {
                   let ratio = res[0].ratio;
                   if (ratio > 1.0) {
                       ratio = 1.0;
                   } else if (ratio < 0.0) {
                       ratio = 0.0;
                   }
                   return ratio;
               }
            })
            .catch((err) => {
                throw err;
            });
    }

    /**
     * Get predicted ratings for all possible products.
     * @param {number} memberId
     * @param {number} opt_category
     * @param {boolean|object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getPredictedAll(memberId:number, opt_category:number = 1, opt_filter:boolean|{[key: number]: boolean} = false, opt_max:number = JOGOO_ITEMS_MAX_RETURN) {
        const query = `SELECT l.item_id2, SUM(r.rating * l.cnt + l.diff_slope) / SUM(l.cnt) AS ratio
FROM jogoo_links l LEFT JOIN jogoo_ratings r ON l.item_id1 = r.product_id AND l.category = r.category
WHERE r.member_id = ${memberId} AND r.category = ${opt_category} AND r.rating >= 0.0 AND l.cnt != 0
GROUP BY l.item_id2
HAVING l.item_id2 NOT IN (SELECT product_id FROM jogoo_ratings WHERE member_id = ${memberId} AND category = ${opt_category})
ORDER BY ratio DESC`;

        return await this.client.query(query)
            .then((res) => {
                let items: Array<object> = [];
                let i = 0;
                res.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.item_id2]) {
                        let ratio = item.ratio;
                        if (ratio > 1.0) {
                            ratio = 1.0;
                        } else if (ratio < 0.0) {
                            ratio = 0.0;
                        }
                        items.push({product_id: item.item_id2, rating: ratio});
                        i++;
                    }
                });
                return items;
            })
            .catch((err) => {
                throw err;
            })
    }

}
