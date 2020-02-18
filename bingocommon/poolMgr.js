/**
 * Created by Johnny on 2016/7/15.
 */

var config = require("../config");
var mysql2 = require('mysql2'); //使用 mysql2 提高执行速度
var moment = require("moment");
var logger = require("./../common/logger");
var EventProxy = require('eventproxy');

var mysqlMgr = require("./mysqlMgr");
var bingo_dbs_model = require("../models/bingo_dbs");
var bingo_db_config_model = require("../models/bingo_db_config");

var db_poolList = [];
var db_division_pool_list = [];

let UserModel = require("../models/user");

exports.GetAllDataFromDB = function(callback){
    var ep = new EventProxy();
    var dbList = [];
    var db_configs = [];
    ep.all('get_dbs', 'get_config', function(res){
        if(!dbList || dbList.length <= 0 || !db_configs || db_configs.length <= 0){
            callback("failed");
            return;
        }

        for(var i = 0; i < dbList.length; ++i){
            var dbInfo = dbList[i];
            if(!dbInfo){
                continue;
            }

            var poolInfo = {
                id : dbInfo.id,
                host : dbInfo.mysql_host,
                user : dbInfo.mysql_user,
                password : dbInfo.mysql_password,
                database : dbInfo.mysql_database,
                port : dbInfo.mysql_port
            };

            poolInfo.pool = mysql2.createPool({
                host: dbInfo.mysql_host,
                user : dbInfo.mysql_user,
                password : dbInfo.mysql_password,
                database : dbInfo.mysql_database,
                port : dbInfo.mysql_port
            });

            db_poolList.push(poolInfo);

            UserModel.Create(poolInfo.pool, function (res) {});
        }

        for(var n = 0; n < db_configs.length; ++n){
            var configInfo = db_configs[n];
            if(!configInfo){
                continue;
            }

            for(var j = 0; j < db_poolList.length; ++j){
                var pool = db_poolList[j];
                if(!pool){
                    continue;
                }

                if(pool.id == configInfo.db_id){
                    configInfo.pool = pool.pool;
                    db_division_pool_list.push(configInfo);
                    break;
                }
            }
        }

        if(!db_poolList || db_poolList.length <= 0 || !db_division_pool_list || db_division_pool_list.length <= 0){
            callback("failed");
            return;
        }

        callback("success");
    });

    bingo_dbs_model.GetAll({}, '', null, function(bingo_dbs){
        dbList = bingo_dbs;
        ep.emit("get_dbs");
    });

    bingo_db_config_model.GetAll({}, '', null, function(bingo_db_config){
        db_configs = bingo_db_config;
        ep.emit("get_config");
    });
};

exports.GetAllUserPools = function(){
    var poolList = [];
    for(var i = 0; i < db_division_pool_list.length; ++i){
        var poolInfo = db_division_pool_list[i];
        if(!poolInfo){
            continue;
        }

        if(poolInfo.type == "user"){
            var bFound = false;
            for(var n = 0; n < poolList.length; ++n){
                if(poolList[n] == poolInfo.pool){
                    bFound = true;
                    break;
                }
            }

            if(!bFound){
                poolList.push(poolInfo.pool);
            }
        }
    }

    return poolList;
};

/**
 * 根据用户ID获取数据库连接。
 */
exports.GetPoolByUserID = function(userID){
    for(var i = 0; i < db_division_pool_list.length; ++i){
        var poolInfo = db_division_pool_list[i];
        if(!poolInfo){
            continue;
        }

        if(poolInfo.type == "user" && userID%100 == poolInfo.param_1){
            return poolInfo.pool;
        }
    }

    return null;
};

/**
 * 根据利是ID获取数据库连接。
 */
exports.GetPoolByRedPacketID = function(redPacketID){
    if(!redPacketID || redPacketID <= 0){
        return this.GetGlobalPool();
    }
    for(var i = 0; i < db_division_pool_list.length; ++i){
        var poolInfo = db_division_pool_list[i];
        if(!poolInfo){
            continue;
        }

        if(poolInfo.type == "redPacket" && redPacketID%100 == poolInfo.param_1){
            return poolInfo.pool;
        }
    }

    return null;
};

/**
 * 返回不拆分数据的数据库连接。
 */
exports.GetGlobalPool = function(){
    for(var i = 0; i < db_division_pool_list.length; ++i){
        var poolInfo = db_division_pool_list[i];
        if(!poolInfo){
            continue;
        }

        if(poolInfo.type == "global"){
            return poolInfo.pool;
        }
    }

    return null;
};