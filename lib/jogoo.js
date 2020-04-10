const jogooClient = require('./client');
const { JOGOO_RATING_PURCHASED, JOGOO_RATING_CLICK_INITIAL, JOGOO_RATING_CLICK_INCREASE, JOGOO_RATING_NOT_INTERESTED } = require('../config');

class Jogoo {

    /**
     * @param {JogooClient} client
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * Set a rating.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} rating
     * @param {number} opt_category
     * @return {Promise<boolean>}
     */
    async setRating(memberId, productId, rating, opt_category = 1) {
        let existing = await this.getRating(memberId, productId, true, opt_category).catch((err) => {
                throw err;
            });
        let query, args;

        if (existing.length === 1) {
            query = 'UPDATE jogoo_ratings SET rating = $1::float, ts = NOW() ' +
                'WHERE member_id = $2::integer AND product_id = $3::integer AND category = $4::integer';
            args = [rating, memberId, productId, opt_category];

            await this.client.query(query, args).catch((err) => {
                throw err;
            });
        } else {
            if (existing.length > 1) {
                await this.deleteRating(memberId, productId, opt_category).catch((err) => {
                    throw err;
                });
            }

            query = 'INSERT INTO jogoo_ratings(member_id, product_id, category, rating, ts) ' +
                'VALUES ($1::integer, $2::integer, $3::integer, $4::float, NOW())';
            args = [memberId, productId, opt_category, rating];

            await this.client.query(query, args).catch((err) => {
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
    async getRating(memberId, productId, opt_notInterested = false, opt_category = 1) {
        let query = 'SELECT rating, ts FROM jogoo_ratings ' +
            'WHERE member_id = $1::integer AND product_id = $2::integer AND category = $3::integer';
        if (!opt_notInterested) {
            query += ' AND rating >= 0.0';
        }
        let args = [memberId, productId, opt_category];
        let rating;

        await this.client.query(query, args)
            .then((res) => {
                rating = res.rows;
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
    async deleteRating(memberId, productId, opt_category = 1) {
        let query = 'DELETE FROM jogoo_ratings ' +
            'WHERE member_id = $1::integer AND product_id = $2::integer AND category = $3::integer';
        let args = [memberId, productId, opt_category];

        this.client.query(query, args).catch((err) => {
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
    async automaticRating(memberId, productId, opt_purchase = false, opt_category = 1) {
        if (opt_purchase) {
            return this.setRating(memberId, productId, JOGOO_RATING_PURCHASED, opt_category);
        } else {
            let existing = await this.getRating(memberId, productId, true, opt_category).catch((err) => {
                throw err;
            });

            if (existing.length === 0) {
                return this.setRating(memberId, productId, JOGOO_RATING_CLICK_INITIAL, opt_category);
            } else if (existing[0].rating < JOGOO_RATING_PURCHASED) {
                return this.setRating(memberId, productId, existing[0].rating + JOGOO_RATING_CLICK_INCREASE, opt_category);
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
    setNotInterested(memberId, productId, opt_category = 1) {
        return this.setRating(memberId, productId, JOGOO_RATING_NOT_INTERESTED, opt_category);
    }

}

module.exports = new Jogoo(jogooClient);