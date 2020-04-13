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
     * @param {number} category
     * @param {boolean|Object} filter
     * @param {number} max
     * @return {Array}
     */
    async getLinkedItems(productId, category = 1, filter = false, max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT item_id2 FROM jogoo_links ' +
            'WHERE item_id1 = $1::integer AND category = $2::integer ' +
            'ORDER BY cnt DESC';
        const args = [productId, category];

        return await this.client.query(query, args)
            .then((res) => {
                let items = [];
                let i = 0;
                res.rows.some((item) => {
                    if (i >= max) {
                        return true;
                    }
                    if (!filter || filter[item.item_id2]) {
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
     * @param {number} minCount
     * @param {number} category
     * @param {boolean|Object} filter
     * @param {number} max
     * @return {Array}
     */
    async getSlopedItems(productId, minCount = 1, category = 1, filter = false, max = JOGOO_ITEMS_MAX_RETURN) {
        const query = 'SELECT item_id2 AS product_id, (diff_slope / cnt) AS diff FROM jogoo_links ' +
            'WHERE item_id1 = $1::integer AND category = $2::integer AND cnt != 0 AND cnt >= $3::integer ' +
            'ORDER BY diff DESC';
        const args = [productId, category, minCount];

        return await this.client.query(query, args)
            .then((res) => {
               let items = [];
               let i = 0;
                res.rows.some((item) => {
                    if (i >= max) {
                        return true;
                    }
                    if (!filter || filter[item.product_id]) {
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