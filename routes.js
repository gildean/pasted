var crypto = require('crypto'),
    config = require('./config'),
    appname = config.appname,
    dbDriver = require('./plugins/' + config.db.driver),
    exts = {
        'CoffeeScript': 'coffee',
        'C#': 'cs',
        'CSS': 'css',
        'Dart': 'dart',
        'Diff': 'diff',
        'Dot': 'dot',
        'Go': 'golang',
        'HAML': 'haml',
        'HTML': 'html',
        'C/C++': 'c',
        'Clojure': 'clj',
        'Jade': 'jade',
        'Java': 'java',
        'JSP': 'jsp',
        'JavaScript': 'js',
        'JSON': 'json',
        'LaTeX': 'tex',
        'LESS': 'less',
        'Lisp': 'lisp',
        'LiveScript': 'ls',
        'Lua': 'lua',
        'LuaPage': 'lp',
        'Lucene': 'lucene',
        'Makefile': 'make',
        'Markdown': 'md',
        'Objective-C': 'm',
        'OCaml': 'ml',
        'Pascal': 'pas',
        'Perl': 'pl',
        'pgSQL': 'pgsql',
        'PHP': 'php',
        'Powershell': 'ps1',
        'Python': 'py',
        'R': 'r',
        'RDoc': 'rd',
        'RHTML': 'rhtml',
        'Ruby': 'rb',
        'OpenSCAD': 'scad',
        'SASS': 'sass',
        'Scala': 'scala',
        'Scheme': 'sc',
        'SCSS': 'scss',
        'SH': 'sh',
        'SQL': 'sql',
        'Stylus': 'stylus',
        'SVG': 'svg',
        'Tex': 'tex',
        'Text': 'txt',
        'Textile': 'textile',
        'Typescript': 'ts',
        'VBScript': 'vbs',
        'XML': 'xml',
        'XQuery': 'xq',
        'YAML': 'yaml'
    };


exports.userCheck = function (req, res, next) {
    res.locals.user = (req.session.user) ? req.session.user.username : 'guest';
    return next();
};

exports.main = function (req, res, next) {
    if ('' === req.query.json && res.locals.paste) {
        res.json(res.locals.paste);
    } else {
        res.locals.title = (res.locals.paste) ? res.locals.paste.name + ' || ' + appname : appname;
        res.locals.token = req.session._csrf;
        res.render('main');
    }
};

exports.save = function (req, res, next) {
    dbDriver.save(req.paste, function (err) {
        if (!err) {
            res.json({ 
                url: (req.host + '/' + req.paste.owner + '/' + req.paste.name),
                name: req.paste.name,
                owner: req.paste.owner,
                _id: req.paste.id
            });
        } else {
            next(new Error('Database broken'));
        }
    });
};

exports.createDoc = function (req, res, next) {
    if (req.body && req.body.paste && req.body.lang) {
        var owner = 'guest';
        var id = (req.body.id) ? req.body.id : false;
        if (req.session.user) {
            owner = req.session.user.username;
        }
        dbDriver.verifyOwner({id: id, owner: owner, lang: req.body.lang}, function (err, verified) {
            if (!err && verified) {
                req.paste = {
                    name: verified.name,
                    owner: owner,
                    text: req.body.paste,
                    lang: verified.lang,
                    _id: verified.id
                };
                next();
            } else if (!(err && verified)) {
                crypto.randomBytes(5, function (ex, buf) {
                    var token = buf.toString('hex'),
                        validExt = exts.hasOwnProperty(req.body.lang),
                        lang = (validExt) ? req.body.lang : 'Text',
                        ext = (validExt) ? exts[lang] : 'txt';
                    req.paste = {
                        name: token + '.' + ext,
                        owner: owner,
                        text: req.body.paste,
                        lang: lang,
                        _id: false
                    };
                    next();
                });
            } else {
                next(new Error('Database broken'));
            }
        });
    } else {
        next(new Error('Invalid paste'));
    }
};

exports.find = function (req, res, next) {
    if (req.params.name.indexOf('.') === 10) {
        dbDriver.find(req.params, function (err, paste) {
            if (!err && paste) {
                if ('' === req.query.raw) {
                    res.set('Content-Type', 'text/plain');
                    res.end(paste.text);
                } else {
                    res.locals.paste = paste;
                    next();
                }
            } else {
                next(new Error('Nothing found'));
            }
        });
    } else {
        next(new Error('Incorrect paste name'));
    }
};
