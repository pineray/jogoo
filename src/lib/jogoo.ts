import { JOGOO_RATING_PURCHASED, JOGOO_RATING_CLICK_INITIAL, JOGOO_RATING_CLICK_INCREASE, JOGOO_RATING_NOT_INTERESTED } from './config';
import { JogooClient } from "./client";

export class Jogoo {

    /** @var {JogooClient} */
    client:JogooClient;

    /** @var {Object} */
    ratings: {purchased:number, clickInitial:number, clickIncrease:number, notInterested:number} = {
        purchased: JOGOO_RATING_PURCHASED,
        clickInitial: JOGOO_RATING_CLICK_INITIAL,
        clickIncrease: JOGOO_RATING_CLICK_INCREASE,
        notInterested: JOGOO_RATING_NOT_INTERESTED
    };

    /**
     * @param {JogooClient} client
     * @param {Object} options
     */
    constructor(client:JogooClient, options?:{[key: string]: string|number}) {
        this.client = client;
        if (options !== undefined && options.hasOwnProperty('ratingPurchased')) {
            this.ratings.purchased = Number(options.ratingPurchased);
        }
        if (options !== undefined && options.hasOwnProperty('clickInitial')) {
            this.ratings.clickInitial = Number(options.clickInitial);
        }
        if (options !== undefined && options.hasOwnProperty('clickIncrease')) {
            this.ratings.clickIncrease = Number(options.clickIncrease);
        }
        if (options !== undefined && options.hasOwnProperty('notInterested')) {
            this.ratings.notInterested = Number(options.notInterested);
        }
    }

    /**
     * Set a rating.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} rating
     * @param {number} opt_category
     * @return {Promise<boolean>}
     */
    async setRating(memberId:number, productId:number, rating:number, opt_category:number = 1) {
        let existing = await this.getRating(memberId, productId, true, opt_category).catch((err) => {
                throw err;
            });
        let query;

        if (existing.length === 1) {
            query = `UPDATE jogoo_ratings SET rating = ${rating}, ts = NOW() WHERE member_id = ${memberId} AND product_id = ${productId} AND category = ${opt_category}`;
            await this.client.query(query).catch((err) => {
                throw err;
            });
        } else {
            if (existing.length > 1) {
                await this.deleteRating(memberId, productId, opt_category).catch((err) => {
                    throw err;
                });
            }

            query = `INSERT INTO jogoo_ratings(member_id, product_id, category, rating, ts) VALUES (${memberId}, ${productId}, ${opt_category}, ${rating}, NOW())`;
            await this.client.query(query).catch((err) => {
                throw err;
            });
        }
        return true;
    }

    /**
     * Get a rating.
     * @param {number} memberId
     * @param {number} productId
     * @param {boolean} opt_notInterested
     * @param {number} opt_category
     * @return {Promise<Array>}
     */
    async getRating(memberId:number, productId:number, opt_notInterested:boolean = false, opt_category:number = 1) {
        let query = `SELECT rating, ts FROM jogoo_ratings WHERE member_id = ${memberId} AND product_id = ${productId} AND category = ${opt_category}`;
        if (!opt_notInterested) {
            query += ' AND rating >= 0.0';
        }
        let rating;

        await this.client.query(query)
            .then((res) => {
                rating = res;
            })
            .catch((err) => {
                throw err;
            });

        return rating;
    }

    /**
     * Delete a rating.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} opt_category
     * @return {Promise<void>}
     */
    async deleteRating(memberId:number, productId:number, opt_category:number = 1) {
        let query = `DELETE FROM jogoo_ratings WHERE member_id = ${memberId} AND product_id = ${productId} AND category = ${opt_category}`;
        this.client.query(query).catch((err) => {
            throw err;
        });
    }

    /**
     * Set a pre-defined rating.
     * @param {number} memberId
     * @param {number} productId
     * @param {boolean} opt_purchase
     * @param {number} opt_category
     * @return {Promise<boolean>}
     */
    async automaticRating(memberId:number, productId:number, opt_purchase:boolean = false, opt_category:number = 1) {
        if (opt_purchase) {
            return this.setRating(memberId, productId, this.ratings.purchased, opt_category);
        } else {
            let existing = await this.getRating(memberId, productId, true, opt_category).catch((err) => {
                throw err;
            });

            if (existing.length === 0) {
                return this.setRating(memberId, productId, this.ratings.clickInitial, opt_category);
            } else if (existing[0].rating < this.ratings.purchased) {
                return this.setRating(memberId, productId, existing[0].rating + this.ratings.clickIncrease, opt_category);
            }
            return true;
        }
    }

    /**
     * Set not-interested.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} opt_category
     * @return {Promise<boolean>}
     */
    setNotInterested(memberId:number, productId:number, opt_category:number = 1) {
        return this.setRating(memberId, productId, this.ratings.notInterested, opt_category);
    }

    /**
     * Convert ratings from a member to another.
     * @param {number} fromMemberId
     * @param {number} toMemberId
     * @param {boolean} opt_clear
     * @param {number} opt_category
     */
    async convertMember(fromMemberId:number, toMemberId:number, opt_clear:boolean = false, opt_category:number = 1) {
        try {
            await this.client.beginTransaction();

            let deleteQuery = `DELETE FROM jogoo_ratings WHERE member_id = ${toMemberId} 
AND product_id IN (SELECT product_id FROM jogoo_ratings WHERE member_id = ${fromMemberId} AND category = ${opt_category}) 
AND category = ${opt_category}`;
            await this.client.query(deleteQuery);

            let insertQuery = `INSERT INTO jogoo_ratings (member_id, product_id, category, rating, ts) 
SELECT ${toMemberId}, F.product_id, ${opt_category}, F.rating, F.ts FROM jogoo_ratings F 
WHERE F.member_id = ${fromMemberId} AND F.category = ${opt_category}`;
            await this.client.query(insertQuery);

            if (opt_clear) {
                let clearQuery = `DELETE FROM jogoo_ratings WHERE member_id = ${fromMemberId} AND category = ${opt_category}`;
                await this.client.query(clearQuery);
            }

            await this.client.commit();
        } catch (err) {
            await this.client.rollback();
            throw err;
        }
    }

}
