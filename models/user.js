var logger = require("./../common/logger");
var mysql = require("./../bingocommon/mysqlWithPoolMgr");
var DBPoolMgr = require("./../bingocommon/poolMgr");
var config = require("../config");

var DBTableFields = [
    {
        name:'id',
        type : 'bigint(20)',
        params : 'NOT NULL',
        index : true
    },
    {
        name:'name',
        type : 'varchar(100)',
        params : 'DEFAULT NULL',
        index : false
    },
    {
        name:'address',
        type : 'varchar(100)',
        params : 'DEFAULT NULL',
        index : false
    },
    {
        name:'phone',
        type : 'varchar(100)',
        params : 'DEFAULT NULL',
        index : false
    },
    {
        name:'province',
        type : 'varchar(45)',
        params : 'COLLATE utf8_unicode_ci DEFAULT NULL',
        index : false
    },
    {
        name:'city',
        type : 'varchar(45)',
        params : 'COLLATE utf8_unicode_ci DEFAULT NULL',
        index : false
    },
    {
        name:'district',
        type : 'varchar(45)',
        params : 'COLLATE utf8_unicode_ci DEFAULT NULL',
        index : false
    },
    {
        name:'create_at',
        type : 'int(11)',
        params : 'DEFAULT NULL',
        index : false
    },
    {
        name:'update_at',
        type : 'int(11)',
        params : 'DEFAULT NULL',
        index : false
    }
];

var DBName = "user";

exports.GetDatabaseFields = function(){
    return DBTableFields;
};


/**
 * 创建数据表
 * @param {Function} callback 回调函数
 **/
exports.Create = function(pool, callback){
    mysql.CreateDatabaseWithDBName(pool, config.mysql_database, DBName, DBTableFields, callback);
};

/**
 * 通过条件找到一条信息。如果有多条数据， 则只返回第一条
 * @param {string} fields 查询返回的字段
 * @param {object} whereData 查询条件
 * @param {object} opt “start limit orderBy groupBy” 等参数
 * @param {Function} callback 回调函数
 **/
exports.GetOne = function(whereData, fields, opt, callback){
    var pool = DBPoolMgr.GetGlobalPool();
    if(!pool){
        callback(null);
        return;
    }

    mysql.SelectDataCommon(pool, config.mysql_database, DBName, fields, whereData, opt, function(rows){
        if(rows && rows.length > 0){
            if(rows.length > 1){
                logger.info("Address Model - GetOne : Get more than one rows!");
            }
            callback(rows[0]);
        }
        else{
            callback(null);
        }
    });
};

/**
 * 通过条件找到所有相关地址信息。
 * @param {string} fields 查询返回的字段
 * @param {object} whereData 查询条件
 * @param {object} opt “start limit orderBy groupBy” 等参数
 * @param {Function} callback 回调函数
 **/
exports.GetAll = function(whereData, fields, opt, callback){
    var pool = DBPoolMgr.GetGlobalPool();
    if(!pool){
        callback(null);
        return;
    }

    mysql.SelectDataCommon(pool, config.mysql_database, DBName, fields, whereData, opt, callback);
};

/**
 * 通过用户ID查询地址信息。
 * @param {string} fields 查询返回的字段
 * @param {string} userID 用户ID
 * @param {Function} callback 回调函数
 **/
exports.GetByID = function(userID, fields, callback){
    this.GetOne({id : userID}, fields, null, callback);
};

/**
 * 更新指定的地址信息。
 * @param {object} updateData 需要更新的数据
 * @param {string} userID 用户ID
 * @param {Function} callback 回调函数
 **/
exports.Update = function(userID, updateData, callback){
    var pool = DBPoolMgr.GetGlobalPool();
    if(!pool){
        callback(null);
        return;
    }

    var now = new Date();
    updateData.update_at = parseInt(now.getTime()/1000);
    mysql.UpdateDataCommon(pool, config.mysql_database, DBName, updateData, {id : userID}, callback);
};

/**
 * 插入新的用户信息。
 * @param {object} userData 新用户的信息
 * @param {Function} callback 回调函数
 **/
exports.Add = function(userData, callback){
    var pool = DBPoolMgr.GetGlobalPool();
    if(!pool){
        callback(null);
        return;
    }
    var now = new Date();
    userData.create_at = parseInt(now.getTime()/1000);
    userData.update_at = parseInt(now.getTime()/1000);
    mysql.SelectDataCommon(pool, config.mysql_database, DBName, 'id', userData, null, function(rows){
        if(rows && rows.length > 0){
            callback(rows[0].id);
            return;
        }
        
        mysql.InsertDataCommonReturnID(pool, config.mysql_database, DBName, 'id', userData, callback);
    });
};

exports.Delete = function(userID, callback){
    var pool = DBPoolMgr.GetGlobalPool();
    if(!pool){
        callback(null);
        return;
    }

    mysql.DeleteCommon(pool, config.mysql_database, DBName, {id : userID}, callback);
    
};