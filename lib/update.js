const { JOGOO_LINKS_MAX_NUMBER, JOGOO_RATING_RETENTION_PERIOD, JOGOO_RATING_THRESHOLD } = require('../config');

class JogooUpdate {

    /**
     * @param {JogooClient} client
     * @param {string} type
     */
    constructor(client, type) {
        this.client = client;
        this.type = type;
    }

    /**
     * Update links of all categories.
     * @return {Promise<void>}
     */
    async updateAll() {
        // Delete older ratings than retention period.
        if (JOGOO_RATING_RETENTION_PERIOD.length > 0) {
            const deleteExpiredQuery = 'DELETE FROM jogoo_ratings WHERE ts < current_timestamp + $1';
            await this.client.query(deleteExpiredQuery, [JOGOO_RATING_RETENTION_PERIOD]);
        }

        let categories = [];
        let categoryQuery = 'SELECT DISTINCT category FROM jogoo_ratings';
        await this.client.query(categoryQuery)
            .then((res) => {
                res.rows.forEach((row) => {
                    categories.push(row.category);
                });
            });

        await Promise.all(categories.map(async category => await this.updateCategory(category)));
    }

    /**
     * Update links of specified category.
     * @param {number} category
     * @return {Promise<void>}
     */
    async updateCategory(category) {
        try {
            await this.client.query('BEGIN');
            const deleteCategoryQuery = 'DELETE FROM jogoo_links WHERE category = $1::integer';
            await this.client.query(deleteCategoryQuery, [category]);

            let insertQuery, args;
            if (JOGOO_LINKS_MAX_NUMBER > 0) {
                if (this.type === 'links') {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT item_id1, item_id2, $1::integer, cnt, 0
FROM (
    SELECT A.product_id AS item_id1, B.product_id AS item_id2, count(*) AS cnt, row_number() OVER (PARTITION BY A.product_id ORDER BY count(*) DESC, B.product_id DESC) AS rank
    FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= $2::float AND category=$1::integer) A
    LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= $2::float AND category=$1::integer) B
    ON A.member_id = B.member_id AND A.product_id <> B.product_id
    GROUP BY A.product_id, B.product_id
    ORDER BY item_id2 DESC
) CNT
WHERE rank <= $3::integer`;
                    args = [category, JOGOO_RATING_THRESHOLD, JOGOO_LINKS_MAX_NUMBER];
                } else {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT item_id1, item_id2, $1::integer, cnt, diff_slope
FROM (
    SELECT A.product_id AS item_id1, B.product_id AS item_id2, count(*) AS cnt, row_number() OVER (PARTITION BY A.product_id ORDER BY count(*) DESC, B.product_id DESC) AS rank,
    SUM(B.rating - A.rating) AS diff_slope 
    FROM (SELECT product_id, member_id, rating FROM jogoo_ratings WHERE rating >= 0 AND category=$1::integer) A
    LEFT JOIN (SELECT product_id, member_id, rating FROM jogoo_ratings WHERE rating >= 0 AND category=$1::integer) B
    ON A.member_id = B.member_id AND A.product_id <> B.product_id
    GROUP BY A.product_id, B.product_id
    ORDER BY item_id2 DESC
) CNT
WHERE rank <= $2::integer`;
                    args = [category, JOGOO_LINKS_MAX_NUMBER];
                }
            } else {
                if (this.type === 'links') {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT A.product_id, B.product_id, $1::integer, count(*), 0
FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= $2::float AND category=$1::integer) A
LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= $2::float AND category=$1::integer) B
ON A.member_id = B.member_id AND A.product_id <> B.product_id
GROUP BY A.product_id, B.product_id`;
                    args = [category, JOGOO_RATING_THRESHOLD];
                } else {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT A.product_id, B.product_id, $1::integer, count(*), SUM(B.rating - A.rating)
FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= 0 AND category=$1::integer) A
LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= 0 AND category=$1::integer) B
ON A.member_id = B.member_id AND A.product_id <> B.product_id
GROUP BY A.product_id, B.product_id`;
                    args = [category];
                }
            }
            await this.client.query(insertQuery, args);

            await this.client.query('COMMIT');
        } catch (err) {
            await this.client.query('ROLLBACK');
            throw err;
        }
    }

}

module.exports = JogooUpdate;
