var path = require("path"),
  routes = require("./routes"),
  exphbs = require("express-handlebars"),
  express = require("express"),
  bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  compression = require("compression"),
  morgan = require("morgan"),
  methodOverride = require("method-override");
//csrf = require('csurf');
var session = require("client-sessions");
var cookie = require("cookies");
var configurations = require("../../lib/configurations.js");
var userRepository = require("../../lib/repositories/userRepository.js");
//errorHandler = require('errorhandler');

module.exports = function (app) {
  app.use(morgan("dev"));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser(configurations.secret));
  //app.use(csrf({ cookie: true }));
  app.use(compression());
  app.use("/public/", express.static(path.join(__dirname, "../public")));
  app.use(
    "/node_modules/",
    express.static(path.join(__dirname, "../node_modules"))
  );

  /*if ('development' === app.get('env')) {
        app.use(errorHandler());
    }*/

  app.engine(
    "handlebars",
    exphbs.create({
      //defaultLayout: 'main',
      layoutsDir: app.get("views") + "/layouts",
      partialsDir: [app.get("views") + "/partials"],
    }).engine
  );
  app.set("view engine", "handlebars");

  app.use(
    session({
      cookieName: configurations.sessionName,
      secret: configurations.secret,
      duration: 120 * 60 * 1000,
      activeDuration: 10 * 60 * 1000,
      httpOnly: false,
      secure: false,
      ephemeral: true,
    })
  );

  app.use(async function (req, res, next) {
    if (
      req[configurations.sessionName] &&
      req[configurations.sessionName].user
    ) {
      var user = await userRepository.select({
        username: req[configurations.sessionName].user.username,
      });
      if (user) {
        req.user = user;
        delete req.user.password; // delete the password from the session
        req[configurations.sessionName].user = user; //refresh the session value
        res.locals.user = user;
      }
      next();
    } else {
      next();
    }
  });

  routes(app);

  //handle csrf
  /*app.use(function (err, req, res, next) {

        if (err.code !== 'EBADCSRFTOKEN'){
           // return next(err);
           return next();
        }

        if(req.xhr){
            return res.ok({payload: null}, '403 invalid csrf token');
        }

        // TODO handle CSRF token errors here
        res.status(403);
        res.render(path.join(__dirname , '../Views/Home/Page404.handlebars'),{layout: false});
    });*/

  //app.use(function(req, res) {
  //res.status(400);
  //res.render(path.join(__dirname , '../Views/Home/Page404.handlebars'),{layout: false});
  //});

  // Handle 500
  app.use(function (err, req, res, next) {
    res.status(500);
    console.log(err);
    res.render(path.join(__dirname, "../Views/Home/Page500.handlebars"), {
      layout: false,
    });
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection at:", reason.stack || reason);
    // Recommended: send the information to sentry.io
    // or whatever crash reporting service you use
  });

  /*app.get('/',function(req, res, next) { 
        res.status(500).send('Something broke!');
        }).error(function(err){
        
        }); */

  return app;
};
