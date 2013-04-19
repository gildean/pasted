/**************************/
/* MongoDB driver plugin */
/************************/                                                                    

// module dependencies and constants
var mongojs = require('mongojs'),
    bcrypt = require('bcrypt'),
    config = require('../config'),
    db = mongojs.connect(config.db.address),
    pastecoll = db.collection('pastes'),
    usercoll = db.collection('pasteusers'),
    hexRegExp = new RegExp('^[0-9a-fA-F]{24}$'),
    ObjectId = mongojs.ObjectId;

// this makes the documents expire at a set time removing the doc from db
pastecoll.ensureIndex({ 'expires': 1 }, { expireAfterSeconds: 172800 });


/**
 * Init the userdb
 *
 * @api private
(function () {
    userdb.count(function (err, users) {
        if (!err && users !== 0) {
            return;
        } else if (users === 0) {
            var values = {
                user: "admin",
                pass: bcrypt.hashSync("admin", 8),
                rw: true,
                lastlogin: new Date()
            };
            userdb.insert(values, function (err) {
                if (err) {
                    throw(err);
                } else {
                    userdb.ensureIndex({ user : 1, rw : 1 });
                    return;
                }
            });
        } else {
            throw(err);
        }
    });
}());
*/

/**
 * Save a new document
 *
 * @param {Object} paste
 * @return {Function} callback(Error)
 * @api public
 */

exports.save = function (paste, callback) {
    paste._id = (paste._id && hexRegExp.test(paste._id)) ? ObjectId(paste._id) : ObjectId();
    paste.expires = new Date();
    pastecoll.save(paste, function (err) {
        if (!err) {
            return callback(null);
        } else {
            return callback(err);
        }
    });
};

/**
 * Find a document
 *
 * @param {Object} query
 * @return {Function} callback(error, paste)
 * @api public
 */

exports.find = function (params, callback) {
    pastecoll.findOne({ 'name': params.name, 'owner': params.owner }, function (err, paste) {
        if (!err && paste) {
            return callback(null, paste);
        } else {
            var errorm = (err) ? err.message : 'Incorrect id';
            return callback(errorm, null);
        }
    });
};


/**
 * Verify the owner of a document
 *
 * @param {Object} owner
 * @return {Function} callback(error, verified)
 * @api public
 */

exports.verifyOwner = function (paste, callback) {
    if (!paste._id || paste._id.length !== 24 || paste.owner === 'guest') {
        return callback(true, null);
    } else {
        pastecoll.findOne({'_id': ObjectId(paste._id)}, function (err, pasted) {
            if (!err && pasted && pasted.owner === paste.owner && paste.lang === pasted.lang) {
                return callback(null, pasted);
            } else {
                var errorm = (err) ? err.message : 'Not allowed';
                return callback(errorm, null);
            }
        });
    }
};
