const { Pool } = require('pg');
const { JOGOO_DB_CONFIG, JOGOO_LINKS_MAX_NUMBER, JOGOO_RATING_RETENTION_PERIOD, JOGOO_RATING_THRESHOLD } = require('./config');
const client = new Pool(JOGOO_DB_CONFIG);

const updateCategory = async (category) => {
    try {
        await client.query('BEGIN');
        const deleteCategoryQuery = 'DELETE FROM jogoo_links WHERE category = $1::integer';
        await client.query(deleteCategoryQuery, [category]);

        if (JOGOO_LINKS_MAX_NUMBER > 0) {
            const insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
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
            const args = [category, JOGOO_RATING_THRESHOLD, JOGOO_LINKS_MAX_NUMBER];
            await client.query(insertQuery, args);
        } else {
            const insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT A.product_id, B.product_id, $1::integer, count(*), 0
FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= $2::float AND category=$1::integer) A
LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= $2::float AND category=$1::integer) B
ON A.member_id = B.member_id AND A.product_id <> B.product_id
GROUP BY A.product_id, B.product_id`;
            const args = [category, JOGOO_RATING_THRESHOLD];
            await client.query(insertQuery, args);
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
};

(async () => {
    // Delete older ratings than retention period.
    if (JOGOO_RATING_RETENTION_PERIOD.length > 0) {
        const deleteExpiredQuery = 'DELETE FROM jogoo_ratings WHERE ts < current_timestamp + $1';
        await client.query(deleteExpiredQuery, [JOGOO_RATING_RETENTION_PERIOD]);
    }

    let categories = [];
    let categoryQuery = 'SELECT DISTINCT category FROM jogoo_ratings';
    await client.query(categoryQuery)
        .then((res) => {
            res.rows.forEach((row) => {
                categories.push(row.category);
            });
        });

    await Promise.all(categories.map(async category => await updateCategory(category)));
})().catch((err) => {throw err;});
