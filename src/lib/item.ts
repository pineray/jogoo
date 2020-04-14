import {JogooClient} from "./client";

import { JOGOO_ITEMS_MAX_RETURN, JOGOO_RATING_THRESHOLD } from './config';

export class JogooItem {

    /** @var {JogooClient} */
    client;

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
     * @param {boolean|Object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getLinkedItems(productId, opt_category = 1, opt_filter = false, opt_max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT item_id2 FROM jogoo_links ' +
            'WHERE item_id1 = $1::integer AND category = $2::integer ' +
            'ORDER BY cnt DESC';
        const args = [productId, opt_category];

        return await this.client.query(query, args)
            .then((res) => {
                let items: Array<number> = [];
                let i = 0;
                res.rows.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.item_id2]) {
                        items.push(item.item_id2);
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
     * @param {boolean|Object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getSlopedItems(productId, opt_minCount = 1, opt_category = 1, opt_filter = false, opt_max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT item_id2 AS product_id, (diff_slope / cnt) AS diff FROM jogoo_links ' +
            'WHERE item_id1 = $1::integer AND category = $2::integer AND cnt != 0 AND cnt >= $3::integer ' +
            'ORDER BY diff DESC';
        const args = [productId, opt_category, opt_minCount];

        return await this.client.query(query, args)
            .then((res) => {
               let items: Array<object> = [];
               let i = 0;
                res.rows.some((item) => {
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
     * @param {boolean|Object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getRecommendedItems(memberId, opt_category = 1, opt_filter = false, opt_max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT l.item_id2, SUM(l.cnt * (r.rating - $3::float)) AS cnter ' +
            'FROM jogoo_links l LEFT JOIN jogoo_ratings r ON l.item_id1 = r.product_id AND l.category = r.category ' +
            'WHERE r.member_id = $1::integer AND r.category = $2::integer AND r.rating >= 0.0 ' +
            'GROUP BY l.item_id2 HAVING SUM(l.cnt * (r.rating - $3::float)) > 0 ' +
            'AND l.item_id2 NOT IN (SELECT product_id FROM jogoo_ratings WHERE member_id = $1::integer AND category = $2::integer) ' +
            'ORDER BY cnter DESC';
        const args = [memberId, opt_category, JOGOO_RATING_THRESHOLD];

        return await this.client.query(query, args)
            .then((res) => {
                let items: Array<number> = [];
                let i = 0;
                res.rows.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.item_id2]) {
                        items.push(item.item_id2);
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
     * @param memberId
     * @param productId
     * @param opt_category
     * @param opt_max
     * @return {Promise<Array>}
     */
    async getTriggerItems(memberId, productId, opt_category = 1, opt_max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT r.product_id FROM jogoo_ratings r LEFT JOIN jogoo_links l ' +
            'ON r.product_id = l.item_id2 AND l.category = r.category ' +
            'WHERE r.member_id = $1::integer AND l.item_id1 = $2::integer AND r.category = $3::integer ' +
            'AND r.rating >= $4::float AND l.cnt > 0';
        const args = [memberId, productId, opt_category, JOGOO_RATING_THRESHOLD];

        return await this.client.query(query, args)
            .then((res) => {
                let items: Array<number> = [];
                let i = 0;
                res.rows.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    items.push(item.product_id);
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
    async getPredictedRate(memberId, productId, opt_category = 1) {
        const query = 'SELECT SUM(r.rating * l.cnt - l.diff_slope) / SUM(l.cnt) AS ratio FROM jogoo_links l, jogoo_ratings r ' +
            'WHERE l.item_id1 = $2::integer AND r.member_id = $1::integer AND l.category = $3::integer ' +
            'AND r.product_id = l.item_id2 AND r.category = l.category';
        const args = [memberId, productId, opt_category];

        return await this.client.query(query, args)
            .then((res) => {
               if (res.rows.length === 0 || res.rows[0].cnter === 0) {
                   return false;
               } else {
                   let ratio = res.rows[0].ratio;
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
     * @param {boolean|Object} opt_filter
     * @param {number} opt_max
     * @return {Promise<Array>}
     */
    async getPredictedAll(memberId, opt_category = 1, opt_filter = false, opt_max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT l.item_id2, SUM(r.rating * l.cnt + l.diff_slope) / SUM(l.cnt) AS ratio ' +
            'FROM jogoo_links l LEFT JOIN jogoo_ratings r ON l.item_id1 = r.product_id AND l.category = r.category ' +
            'WHERE r.member_id = $1::integer AND r.category = $2::integer AND r.rating >= 0.0 AND l.cnt != 0 ' +
            'GROUP BY l.item_id2 ' +
            'HAVING l.item_id2 NOT IN (SELECT product_id FROM jogoo_ratings WHERE member_id = $1::integer AND category = $2::integer) ' +
            'ORDER BY ratio DESC';
        const args = [memberId, opt_category];

        return await this.client.query(query, args)
            .then((res) => {
                let items: Array<object> = [];
                let i = 0;
                res.rows.some((item) => {
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