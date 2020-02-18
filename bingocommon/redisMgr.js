/**
 * Created by Johnny on 2016/7/15.
 */

var config = require("../config");
var redis = require('redis');
var moment = require("moment");
var logger = require("./../common/logger");
var EventProxy = require('eventproxy');

var mysqlMgr = require("./mysqlMgr");
var bingo_redises_model = require("../models/bingo_redises");
var bingo_redis_config_model = require("../models/bingo_redis_config");

var redisPoolList = [];
var redis_division_list = [];

function CreateRedis(host, port){
    var redisImpl = redis.createClient({
        host : host,
        port : port,
        retry_strategy: function (options) {
            if (options.error && options.error.code === 'ECONNREFUSED') {
                // End reconnecting on a specific error and flush all commands with
                // a individual error
                return new Error('The server refused the connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                // End reconnecting after a specific timeout and flush all commands
                // with a individual error
                return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // reconnect after
            return Math.min(options.attempt * 100, 1000);
        }
    });

    redisImpl.on("error", function (err) {
        logger.error("Redis[host:" + host + ",port:" + port + " Error " + err);
    });

    return redisImpl;
}

exports.GetAllDataFromDB = function(callback){
    var ep = new EventProxy();
    var redisList = [];
    var redis_configs = [];
    ep.all('get_redises', 'get_config', function(res){
        if(!redisList || redisList.length <= 0 || !redis_configs || redis_configs.length <= 0){
            callback("failed");
            return;
        }

        for(var i = 0; i < redisList.length; ++i){
            var redisInfo = redisList[i];
            if(!redisInfo){
                continue;
            }

            redisPoolList.push({
                id : redisInfo.id,
                host : redisInfo.redis_host,
                port : redisInfo.redis_port,
                pool : CreateRedis(redisInfo.redis_host, redisInfo.redis_port)
            });
        }

        for(var n = 0; n < redis_configs.length; ++n){
            var configInfo = redis_configs[n];
            if(!configInfo){
                continue;
            }

            for(var j = 0; j < redisPoolList.length; ++j){
                var pool = redisPoolList[j];
                if(!pool){
                    continue;
                }

                if(pool.id == configInfo.redis_id){
                    configInfo.pool = pool.pool;
                    redis_division_list.push(configInfo);
                    break;
                }
            }
        }

        if(!redisPoolList || redisPoolList.length <= 0 || !redis_division_list || redis_division_list.length <= 0){
            callback("failed");
            return;
        }

        callback("success");
    });

    bingo_redises_model.GetAll({}, '', null, function(bingo_redises){
        redisList = bingo_redises;
        ep.emit("get_redises");
    });

    bingo_redis_config_model.GetAll({}, '', null, function(bingo_redis_config){
        redis_configs = bingo_redis_config;
        ep.emit("get_config");
    });
};


/**
 * 根据用户ID获取数据库连接。
 */
exports.GetPoolByUserID = function(userID){
    for(var i = 0; i < redis_division_list.length; ++i){
        var poolInfo = redis_division_list[i];
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
    for(var i = 0; i < redis_division_list.length; ++i){
        var poolInfo = redis_division_list[i];
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
    for(var i = 0; i < redis_division_list.length; ++i){
        var poolInfo = redis_division_list[i];
        if(!poolInfo){
            continue;
        }

        if(poolInfo.type == "global"){
            return poolInfo.pool;
        }
    }

    return null;
};