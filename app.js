'use strict';

//var fs = require('fs');
var path = require('path');
var http = require('http');
var express = require('express');
var config = require('./config');
var routes = require('./routes/routes');
var _ = require('lodash');
var ui = require('./widgets/uiSvr');
var viewsWares = require('./middlewares/views');
// 注意：原来express3.x的中间件改为模块方式引入
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorhandler = require('errorhandler');
// application
var app = express();
// 设置模板路径
app.set('views', path.join(__dirname, 'views/templates'));

// 中间件
app.use(cookieParser(config.authCookieSecret));
// 这里的调用需注意：`bodyParser`不能直接调用了！
// 参考：https://github.com/ar-insect/body-parser#express-route-specific
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// https://github.com/expressjs/session#cookie-options
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
// express4.x只保留了`static`中间件
// 静态资源目录
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// 图像
app.use('/images', express.static(path.join(__dirname, 'public/images')));
// rewrite res.render
app.use(viewsWares.render);

// 路由
routes(app);

// 错误处理
if (config.debug) {
  app.use(errorhandler({ dumpExceptions: true, showStack: true }));
} else {
  app.use(function (err, req, res, next) {
    return res.status(500).send('500 status');
  });
}

// 模板引擎
var templateEngine = require('./widgets/' + config.template.name + '/api');
app.engine(config.template.extension, config.template.callback(templateEngine));
// set port
app.set('port', process.env.PORT || config.port);
var port = process.argv[2];
port = /^\d{4,5}$/.test(port) ? port : app.get('port');
http.createServer(app).listen(port, function () {
  console.log('Server listening on port ' + port);
}).on('error', function (err) {
  console.log('Error', err.code);
});

module.exports = app;