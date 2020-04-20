import { JOGOO_LINKS_MAX_NUMBER, JOGOO_RATING_RETENTION_PERIOD, JOGOO_RATING_THRESHOLD } from './config';
import { JogooClient } from "./client";

export class JogooAggregator {

    /** @var {JogooClient} */
    client:JogooClient;

    /** @var {string} */
    type:string;

    /** @var {number} */
    linksMaxNumber:number = JOGOO_LINKS_MAX_NUMBER;

    /** @var {string} */
    retentionPeriod:string = JOGOO_RATING_RETENTION_PERIOD;

    /** @var {number} */
    threshold:number = JOGOO_RATING_THRESHOLD;

    /**
     * @param {JogooClient} client
     * @param {string} type
     * @param {Object} options
     */
    constructor(client:JogooClient, type:string, options?:{[key: string]: string|number}) {
        this.client = client;
        this.type = type;
        if (options !== undefined && options.hasOwnProperty('linksMaxNumber')) {
            this.linksMaxNumber = Number(options.linksMaxNumber);
        }
        if (options !== undefined && options.hasOwnProperty('retentionPeriod')) {
            this.retentionPeriod = String(options.retentionPeriod);
        }
        if (options !== undefined && options.hasOwnProperty('threshold')) {
            this.threshold = Number(options.threshold);
        }
    }

    /**
     * Update links of all categories.
     * @return {Promise<void>}
     */
    async updateAll() {
        // Delete older ratings than retention period.
        if (this.retentionPeriod.length > 0) {
            const deleteExpiredQuery = `DELETE FROM jogoo_ratings WHERE ts < current_timestamp + '${this.retentionPeriod}'`;
            await this.client.query(deleteExpiredQuery);
        }

        let categories: Array<number> = [];
        let categoryQuery = 'SELECT DISTINCT category FROM jogoo_ratings';
        await this.client.query(categoryQuery)
            .then((res) => {
                res.forEach((row) => {
                    categories.push(Number(row.category));
                });
            });

        await Promise.all(categories.map(async category => await this.updateCategory(category)));
    }

    /**
     * Update links of specified category.
     * @param {number} category
     * @return {Promise<void>}
     */
    async updateCategory(category:number) {
        try {
            await this.client.beginTransaction();
            const deleteCategoryQuery = `DELETE FROM jogoo_links WHERE category = ${category}`;
            await this.client.query(deleteCategoryQuery);

            let insertQuery;
            if (this.linksMaxNumber > 0) {
                if (this.type === 'links') {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT item_id1, item_id2, ${category}, cnt, 0
FROM (
    SELECT A.product_id AS item_id1, B.product_id AS item_id2, count(*) AS cnt, row_number() OVER (PARTITION BY A.product_id ORDER BY count(*) DESC, B.product_id DESC) AS rank
    FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= ${this.threshold} AND category=${category}) A
    LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= ${this.threshold} AND category=${category}) B
    ON A.member_id = B.member_id AND A.product_id <> B.product_id
    GROUP BY A.product_id, B.product_id
    ORDER BY item_id2 DESC
) CNT
WHERE rank <= ${this.linksMaxNumber}`;
                } else {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT item_id1, item_id2, ${category}, cnt, diff_slope
FROM (
    SELECT A.product_id AS item_id1, B.product_id AS item_id2, count(*) AS cnt, row_number() OVER (PARTITION BY A.product_id ORDER BY count(*) DESC, B.product_id DESC) AS rank,
    SUM(B.rating - A.rating) AS diff_slope 
    FROM (SELECT product_id, member_id, rating FROM jogoo_ratings WHERE rating >= 0 AND category=${category}) A
    LEFT JOIN (SELECT product_id, member_id, rating FROM jogoo_ratings WHERE rating >= 0 AND category=${category}) B
    ON A.member_id = B.member_id AND A.product_id <> B.product_id
    GROUP BY A.product_id, B.product_id
    ORDER BY item_id2 DESC
) CNT
WHERE rank <= ${this.linksMaxNumber}`;
                }
            } else {
                if (this.type === 'links') {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT A.product_id, B.product_id, ${category}, count(*), 0
FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= ${this.threshold} AND category=${category}) A
LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= ${this.threshold} AND category=${category}) B
ON A.member_id = B.member_id AND A.product_id <> B.product_id
GROUP BY A.product_id, B.product_id`;
                } else {
                    insertQuery = `INSERT INTO jogoo_links (item_id1,item_id2,category,cnt,diff_slope)
SELECT A.product_id, B.product_id, ${category}, count(*), SUM(B.rating - A.rating)
FROM (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= 0 AND category=${category}) A
LEFT JOIN (SELECT product_id, member_id FROM jogoo_ratings WHERE rating >= 0 AND category=${category}) B
ON A.member_id = B.member_id AND A.product_id <> B.product_id
GROUP BY A.product_id, B.product_id`;
                }
            }
            await this.client.query(insertQuery);

            await this.client.commit();
        } catch (err) {
            await this.client.rollback();
            throw err;
        }
    }

}

export class JogooAggregateLinks extends JogooAggregator {
    constructor(client: JogooClient, options?:{[key: string]: string|number}) {
        super(client, 'links', options);
    }

    async do() {
        return await this.updateAll();
    }
}

export class JogooAggregateSlope extends JogooAggregator {
    constructor(client: JogooClient, options?:{[key: string]: string|number}) {
        super(client, 'slope', options);
    }

    async do() {
        return await this.updateAll();
    }
}