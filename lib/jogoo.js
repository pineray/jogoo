const jogooClient = require('./client');

class Jogoo {

    /**
     * @param {jogooClient} client
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * Set a rating.
     * @param {number} memberId
     * @param {number} productId
     * @param {number} rating
     * @param {number} category
     * @return {boolean|Promise<void>}
     */
    async setRating(memberId, productId, rating, category = 1) {
        let existing = await this.getRating(memberId, productId, true, category).catch((err) => {
                throw err;
            });
        let query, args;

        if (existing.length === 1) {
            query = 'UPDATE jogoo_ratings SET rating = $1::float, ts = NOW() ' +
                'WHERE member_id = $2::integer AND product_id = $3::integer AND category = $4::integer';
            args = [rating, memberId, productId, category];

            await this.client.query(query, args).catch((err) => {
                throw err;
            });
        } else {
            if (existing.length > 1) {
                await this.deleteRating(memberId, productId, category).catch((err) => {
                    throw err;
                });
            }

            query = 'INSERT INTO jogoo_ratings(member_id, product_id, category, rating, ts) ' +
                'VALUES ($1::integer, $2::integer, $3::integer, $4::float, NOW())';
            args = [memberId, productId, category, rating];

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
     * @param {boolean} notInterested
     * @param {number} category
     * @return {Promise<void>}
     */
    async getRating(memberId, productId, notInterested = false, category = 1) {
        let query = 'SELECT rating, ts FROM jogoo_ratings ' +
            'WHERE member_id = $1::integer AND product_id = $2::integer AND category = $3::integer';
        if (!notInterested) {
            query += ' AND rating >= 0.0';
        }
        let args = [memberId, productId, category];
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
     * @param {number} category
     * @return {Promise<void>}
     */
    async deleteRating(memberId, productId, category = 1) {
        let query = 'DELETE FROM jogoo_ratings ' +
            'WHERE member_id = $1::integer AND product_id = $2::integer AND category = $3::integer';
        let args = [memberId, productId, category];

        this.client.query(query, args).catch((err) => {
            throw err;
        });
    }
}

module.exports = new Jogoo(jogooClient);