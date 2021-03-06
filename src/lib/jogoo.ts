import {
    JOGOO_RATING_PURCHASED,
    JOGOO_RATING_CLICK_INITIAL,
    JOGOO_RATING_CLICK_INCREASE,
    JOGOO_RATING_NOT_INTERESTED,
    JOGOO_RATING_RETENTION_PERIOD,
    JOGOO_RATING_THRESHOLD,
    JOGOO_LINKS_MAX_NUMBER,
    JOGOO_LINKS_REALTIME_LINK,
    JOGOO_LINKS_REALTIME_SLOPE
} from './config';
import { JogooClient } from "./client";
import { JogooAggregateLinks, JogooAggregateSlope } from "./aggregator";

export class Jogoo {

    /** @var {JogooClient} */
    client:JogooClient;

    /** @var {Object} */
    links: {maxNumber:number, realtimeLink:boolean, realtimeSlope:boolean} = {
        maxNumber: JOGOO_LINKS_MAX_NUMBER,
        realtimeLink: JOGOO_LINKS_REALTIME_LINK,
        realtimeSlope: JOGOO_LINKS_REALTIME_SLOPE
    };

    /** @var {Object} */
    ratings: {purchased:number, clickInitial:number, clickIncrease:number, notInterested:number, retentionPeriod:string, threshold:number} = {
        purchased: JOGOO_RATING_PURCHASED,
        clickInitial: JOGOO_RATING_CLICK_INITIAL,
        clickIncrease: JOGOO_RATING_CLICK_INCREASE,
        notInterested: JOGOO_RATING_NOT_INTERESTED,
        retentionPeriod: JOGOO_RATING_RETENTION_PERIOD,
        threshold: JOGOO_RATING_THRESHOLD
    };

    /**
     * @param {JogooClient} client
     * @param {Object} options
     */
    constructor(client:JogooClient, options?:{[key: string]: string|number|boolean}) {
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
        if (options !== undefined && options.hasOwnProperty('retentionPeriod')) {
            this.ratings.retentionPeriod = String(options.retentionPeriod);
        }
        if (options !== undefined && options.hasOwnProperty('threshold')) {
            this.ratings.threshold = Number(options.threshold);
        }
        if (options !== undefined && options.hasOwnProperty('linksMaxNumber')) {
            this.links.maxNumber = Number(options.linksMaxNumber);
        }
        if (options !== undefined && options.hasOwnProperty('realtimeLink')) {
            this.links.realtimeLink = Boolean(options.realtimeLink);
        }
        if (options !== undefined && options.hasOwnProperty('realtimeSlope')) {
            this.links.realtimeSlope = Boolean(options.realtimeSlope);
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

            if (this.links.realtimeLink) {
                await this.setLinksRealtime(memberId, productId, opt_category, rating, existing[0].rating);
            } else if (this.links.realtimeSlope) {
                await this.setSlopeRealtime(memberId, productId, opt_category, rating, existing[0].rating);
            }
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

            if (this.links.realtimeLink) {
                await this.setLinksRealtime(memberId, productId, opt_category, rating, -1.0);
            } else if (this.links.realtimeSlope) {
                await this.setSlopeRealtime(memberId, productId, opt_category, rating, -1.0);
            }
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
        await this.client.query(query);
    }

    /**
     * Delete ratings inputted by a specified member.
     * @param {number} memberId
     * @param {number} opt_category
     * @return {Promise<void>}
     */
    async deleteMemberRatings(memberId:number, opt_category:number = 1) {
        let query = `DELETE FROM jogoo_ratings WHERE member_id = ${memberId} AND category = ${opt_category}`;
        await this.client.query(query);
    }

    /**
     * Delete ratings to a specified product.
     * @param {number} productId
     * @param {number} opt_category
     * @return {Promise<void>}
     */
    async deleteProductRatings(productId:number, opt_category:number = 1) {
        let query = `DELETE FROM jogoo_ratings WHERE product_id = ${productId} AND category = ${opt_category}`;
        await this.client.query(query);
    }

    /**
     * Delete older ratings than retention period.
     */
    async deleteOutdatedRatings() {
        if (this.ratings.retentionPeriod.length > 0) {
            const deleteExpiredQuery = `DELETE FROM jogoo_ratings WHERE ts < current_timestamp + '${this.ratings.retentionPeriod}'`;
            await this.client.query(deleteExpiredQuery);
        }
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

    /**
     * Update links without whole aggregation.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} category
     * @param {number} rating
     * @param {number} previous
     */
    private async setLinksRealtime(memberId:number, productId:number, category:number, rating:number, previous:number) {
        if ((rating >= this.ratings.threshold && previous < this.ratings.threshold) || (rating < this.ratings.threshold && previous >= this.ratings.threshold)) {
            let jogooAggregateLinks = new JogooAggregateLinks(this.client, {linksMaxNumber: this.links.maxNumber, threshold: this.ratings.threshold});
            await jogooAggregateLinks.partialUpdate(memberId, productId, category);
        }
    }

    /**
     * Update slopes without whole aggregation.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} category
     * @param {number} rating
     * @param {number} previous
     */
    private async setSlopeRealtime(memberId:number, productId:number, category:number, rating:number, previous:number) {
        if (rating > 0.0 || previous > 0.0) {
            let jogooAggregateSlope = new JogooAggregateSlope(this.client, {linksMaxNumber: this.links.maxNumber, threshold: this.ratings.threshold});
            await jogooAggregateSlope.partialUpdate(memberId, productId, category);
        }
    }

}
