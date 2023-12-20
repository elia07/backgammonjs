var configurations = require('../../lib/configurations.js');

module.exports = {
    requireLogin: function requireLogin (req, res, next) {
        if (!req.user) {
          res.redirect('/');
        } else {
          next();
        }
    },
    ApiAuthorize: function requireLogin (req, res, next) {
      if(req.body.ApiPassword==configurations.ApiPassword)
      {
        next();
      }
      else
      {
        res.redirect('/');
      }
        
    }
}