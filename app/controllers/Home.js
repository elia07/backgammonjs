var path = require("path");
var fs = require("fs");
var userRepository = require("../../lib/repositories/userRepository.js");
var model = require("../../lib/model.js");
var session = require("client-sessions");
var cookie = require("cookies");
var cryptoJS = require("crypto-js");
var svgCaptcha = require("svg-captcha");
var configurations = require("../../lib/configurations.js");
var enums = require("../../lib/enums.js");

module.exports = {
  Index: async function (req, res) {
    if (userRepository.getUserFromCookie(req.headers.cookie)) {
      res.redirect("/Lobby/Index");
      return;
    } else if (req.body.username != null && req.body.sessionKey != "") {
      var user = await userRepository.select({
        username: req.body.username,
        sessionKey: req.body.sessionKey,
      });
      if (user) {
        userRepository.updateLoginDate(user);
        user.sessionKey = "";
        await userRepository.update({ username: req.body.username }, user);
        req[configurations.sessionName].user = user;
        res.redirect("/profile/lobby");
        return;
      } else {
        res.redirect("/Home/Page404");
        return;
      }
    } else {
      if (configurations.RequireSessionKey == false) {
        var viewModel = {
          pageTitle: "Index",
        };
        res.render(path.join(__dirname, "../Views/Home/Index.handlebars"), {
          viewModel: viewModel,
        });
      } else {
        res.redirect("/Home/Page404");
        return;
      }
    }
  },
  Page404: function (req, res) {
    var viewModel = {
      pageTitle: "404",
    };
    res.render(path.join(__dirname, "../Views/Home/Page404.handlebars"), {
      layout: path.join(__dirname, "../Views/Layouts/FormsLayout.handlebars"),
      viewModel: viewModel,
    });
  },
  Page500: function (req, res) {
    var viewModel = {
      pageTitle: "500",
    };
    res.render(path.join(__dirname, "../Views/Home/Page500.handlebars"), {
      layout: path.join(__dirname, "../Views/Layouts/FormsLayout.handlebars"),
      viewModel: viewModel,
    });
  },
  Logout: function (req, res) {
    req[configurations.sessionName].reset();
    res.clearCookie([configurations.sessionName]);
    res.redirect("/");
  },
  Login: async function (req, res) {
    var user = await userRepository.select({
      username: req.body.username,
      password: cryptoJS.MD5(req.body.password).toString(),
      isActive: true,
    });
    var errorMessage = "";
    if (user) {
      userRepository.updateLoginDate(user);
      req[configurations.sessionName].user = user;
      res.redirect("/Lobby/Index");
      return;
    } else {
      errorMessage = "Username or password is worng or user is not active";
    }
    res.redirect("/?errorMessage=" + errorMessage);
  },
};
