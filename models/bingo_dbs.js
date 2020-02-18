var logger = require("./../common/logger");
var mysql = require("./../bingocommon/mysqlMgr");
var config = require("../config");

var DBTableFields = [
    {
        name:'id',
        type : 'bigint(20)',
        params : 'NOT NULL AUTO_INCREMENT',
        index : true
    },
    {
        name:'mysql_host',
        type : 'varchar(200)',
        params : 'NOT NULL',
        index : false
    },
    {
        name:'mysql_user',
        type : 'varchar(100)',
        params : 'NOT NULL',
        index : false
    },
    {
        name:'mysql_password',
        type : 'varchar(100)',
        params : 'NOT NULL',
        index : false
    },
    {
        name:'mysql_database',
        type : 'varchar(100)',
        params : 'NOT NULL',
        index : false
    },
    {
        name:'mysql_port',
        type : 'varchar(100)',
        params : 'NOT NULL',
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

var DBName = "bingo_dbs";

exports.GetDatabaseFields = function(){
    return DBTableFields;
};

/**
 * 创建数据表
 * @param {Function} callback 回调函数
 **/
exports.Create = function(callback){
    mysql.CreateDatabaseWithDBName(config.mysql_database, DBName, DBTableFields, callback);
};

/**
 * 通过条件找到一条地址信息。如果有多条数据， 则只返回第一条
 * @param {string} fields 查询返回的字段
 * @param {object} whereData 查询条件
 * @param {object} opt “start limit orderBy groupBy” 等参数
 * @param {Function} callback 回调函数
 **/
exports.GetOne = function(whereData, fields, opt, callback){
    mysql.SelectDataCommon(config.mysql_database, DBName, fields, whereData, opt, function(rows){
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
    mysql.SelectDataCommon(config.mysql_database, DBName, fields, whereData, opt, callback);
};

/**
 * 通过用户ID查询地址信息。
 * @param {string} fields 查询返回的字段
 * @param {string} addressID 地址ID
 * @param {Function} callback 回调函数
 **/
exports.GetByID = function(addressID, fields, callback){
    this.GetOne({id : addressID}, fields, null, callback);
};

/**
 * 更新指定的地址信息。
 * @param {object} updateData 需要更新的数据
 * @param {string} addressID 地址ID
 * @param {Function} callback 回调函数
 **/
exports.Update = function(addressID, updateData, callback){
    var now = new Date();
    updateData.update_at = parseInt(now.getTime()/1000);
    mysql.UpdateDataCommon(config.mysql_database, DBName, updateData, {id : addressID}, callback);
};

/**
 * 插入新的用户信息。
 * @param {object} addressData 新地址的信息
 * @param {Function} callback 回调函数
 **/
exports.Add = function(addressData, callback){
    mysql.SelectDataCommon(config.mysql_database, DBName, 'id', addressData, null, function(rows){
        if(rows && rows.length > 0){
            callback(rows[0].id);
            return;
        }

        var now = new Date();
        addressData.create_at = parseInt(now.getTime()/1000);
        addressData.update_at = parseInt(now.getTime()/1000);
        mysql.InsertDataCommonReturnID(config.mysql_database, DBName, 'id', addressData, callback);
    });
};
