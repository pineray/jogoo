const jogooClient = require('./client');
const { JOGOO_ITEMS_MAX_RETURN } = require('../config');

class JogooItem {

    /**
     * @param {JogooClient} client
     */
    constructor(client) {
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
                let items = [];
                let i = 0;
                res.rows.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.item_id2]) {
                        items.push(item.item_id2);
                    }
                    i++;
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
               let items = [];
               let i = 0;
                res.rows.some((item) => {
                    if (i >= opt_max) {
                        return true;
                    }
                    if (!opt_filter || opt_filter[item.product_id]) {
                        items.push(item);
                    }
                    i++;
                });
               return items;
            })
            .catch((err) => {
                throw err;
            });
    }
}

module.exports = new JogooItem(jogooClient);