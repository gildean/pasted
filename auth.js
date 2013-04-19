var config = require('./config'),
    db = require('mongojs').connect(config.dbinfo),
    userdb = db.collection('user'),
    bcrypt = require('bcrypt');


// logon with bcrypt hash check
exports.loginUser = function (req, res) {
    userdb.findOne({ user : req.body.username.toString() },
        function(err, useraccount) {
            var password, passhash;
            if (!err && useraccount) {
                password = req.body.password;
                passhash = useraccount.pass;
                bcrypt.compare(password, passhash, function (err, same) {
                    if (!err && same) {
                        userdb.update({ user: useraccount.user }, { $set : { lastlogin: new Date() }}, function (err) {
                            if (!err) {
                                req.session.user = useraccount;
                                res.redirect('/');
                            } else {   
                                res.status(500);
                                res.render('error', { error: err || 'Database error!' });
                            }
                        });
                    } else {                  
                        res.status(401);
                        res.render('error', { error: 'loginerror' });
                    }
                });
            } else if (err) {                        
                res.status(err.status || 500);
                res.render('error', { error: err || 'Database error!' });
            } else {                        
                res.status(401);
                res.render('error', { error: 'loginerror' });
            }
        }
    );
};


exports.logoutUser = function (req, res) {
    req.session.destroy();
    res.send(200, 'Logout OK');
};


// check that the user doesn't already exist and then create it with a randomly salted password hash
exports.createUser = function (req, res) {
    if (req.session.user.rw) {
        userdb.findOne({ user: req.body.username }, function (err, user) {
            if (user) {
                res.send(409, { error: 'User already exists!' });
            } else if (req.body.password !== req.body.passwordconf) {
                res.send(409, { error: 'Password mismatch!' });
            } else if (!err) {
                var values = {
                    user: req.body.username,
                    pass: bcrypt.hashSync(req.body.password, 8),
                    rw: req.body.rw,
                    lastlogin: new Date()
                };
                userdb.insert(values, function (err) {
                    if (!err) {
                        res.send(200, 'User added!');
                    } else {
                        res.send(500, { error: err || 'Database error!'});
                    }
                });
            } else {
                res.status(500);
                res.send(500, { error: err || 'Database error!'});
            } 
        });
    } else {
        res.send(403, { error: 'Forbidden' });
    };
};


exports.changePass = function (req, res) {
    var changingUser = req.session.user.user;
    if (req.session.user.rw && req.body.username !== undefined) {
        changingUser = req.body.username;
    }
    userdb.findOne({ user: changingUser }, function (err, user) {
        if (!err && user) {
            if (req.body.password && req.body.passwordconf && req.body.password === req.body.passwordconf) {
                userdb.update({ user: changingUser }, { $set : { password: bcrypt.hashSync(req.body.password, 8) }}, function (err) {
                    if (!err) {
                        res.send(200, 'ok');
                    } else {
                        res.send(500, { error: err });
                    }
                });
            } else {
                res.send(409, { error: 'Password mismatch!' });
            }
        } else {
            res.send(500, { error: err || 'User not found!' });
        }
    });
};
