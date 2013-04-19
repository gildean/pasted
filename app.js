var express = require('express'),
    routes = require('./routes'),
    config = require('./config'),
    app = express(),
    port = process.env.PORT || config.port,
    server = require('http').createServer(app).listen(port);

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'secret' }));
app.use(express.csrf());
app.locals.paste = null;
app.locals.appname = config.appname;
app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use('/static', express.static(__dirname + '/public'));
app.use(routes.userCheck);

app.post('/save/', routes.createDoc, routes.save);

//app.post('/register/', auth.createUser);

//app.post('/login/', auth.loginUser);

//app.post('/logout/', auth.logoutUser);

//app.get('/login/', routes.showLogin);

app.get('/:owner/:name', routes.find, routes.main);

app.get('/', routes.main);

app.use(function (req, res, next) {
	res.status(404);
	res.render('error', {title: 'Error 404 || ' + config.appname, error: 'Not found'});
});

app.use(function (err, req, res, next) {
	res.status(err.status || 418);
    res.render('error', { title: 'Error || ' + config.appname, error: err.message});
});
