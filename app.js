var express = require('express');
var app = express();
var userController = require('./controller/userController');
var bodyParser = require('body-parser');
var PoolMgr = require('./bingocommon/poolMgr');
var logger = require('./common/logger');
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));


app.post('/save_user_info',   userController.saveUserInfo);

if (!module.parent) {
  PoolMgr.GetAllDataFromDB(function(poolRes){
    if(poolRes != 'success'){
      logger.error("Get DB Config Failed, can not start!!");
      return;
    }

    app.listen(9886, function(){
      console.log("start");
    });
  
  });
}
