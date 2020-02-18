/**
 * Created by Johnny on 2016/7/15.
 */

var config = require("../config");
var mysql2 = require('mysql2'); //使用 mysql2 提高执行速度
var moment = require("moment");
var logger = require("./../common/logger");
var EventProxy = require('eventproxy');

var pool = mysql2.createPool({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database,
    port: config.mysql_port
});

/**
 * 根据数据库名称和字段列表创建数据库。
 * @param {string} TableName 表名称
 * @param {Array} fields 字段列表
 * @param {Function} callback 回调函数
 */
exports.CreateDatabase = function(TableName, fields, callback){
    this.CreateDatabaseWithDBName(config.mysql_database, TableName, fields, callback);
};

/**
 * 根据数据库名称和字段列表创建数据库。
 * @param {string} Database 数据库名称
 * @param {string} TableName 表名称
 * @param {Array} fields 字段列表
 * @param {Function} callback 回调函数
 */
exports.CreateDatabaseWithDBName = function(Database, TableName, fields, callback){
    if(!fields || fields.length <= 0){
        logger.error("CreateDatabase : Null fields error!");
        callback('failed');
        return;
    }

    var createSQL = "CREATE TABLE IF Not exists `" + Database + "`.`" + TableName + "` (";

    var indexList = [];
    for(var i = 0; i < fields.length; ++i){
        createSQL += " `" + fields[i].name + "` " + fields[i].type + " " + fields[i].params + ", ";
        if(fields[i].index){
            indexList.push(fields[i].name);
        }
    }

    if(indexList.length <= 0){
        logger.error("CreateDatabase : No index found!");
        callback('failed');
        return;
    }

    createSQL += " PRIMARY KEY (";
    for(var n = 0; n < indexList.length; ++n){
        if(n != 0){
            createSQL += ",";
        }
        createSQL += "`" + indexList[n] + "`";
    }
    createSQL += ") ";

    createSQL += ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci";

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("CreateDatabase Pool GetConnection Error ==> " + err);
            callback("failed");
            return;
        }

        conn.query(createSQL,function(err,rows){
            if (err) {
                logger.error("CreateDatabase Pool Query Error ==> " + err);
                callback('failed');
            }
            else{
                callback('success');
            }

            conn.release();
        });
    });
};

function JoinWhereString(whereData){
    var whereString = "";
    if(whereData){
        whereString += " where 1=1 ";

        for(var key in whereData){
            if(whereData[key] == null){
                continue;
            }

            //或者 OR
            if(key == 'or' && typeof(whereData[key]) == 'object'){
                whereString += " and (1=0 ";
                for(var orKey in whereData[key]){
                    if(typeof(whereData[key][orKey]) == 'object'){
                        if(whereData[key][orKey].gt){
                            whereString += " or `" + orKey + "`>'" + whereData[key][orKey].gt + "'";
                        } else if(whereData[key][orKey].gte){
                            whereString += " or `" + orKey + "`>='" + whereData[key][orKey].gte + "'";
                        }

                        if(whereData[key][orKey].lt){
                            whereString += " or `" + orKey + "`<'" + whereData[key][orKey].lt + "'";
                        } else if(whereData[key][orKey].lte){
                            whereString += " or `" + orKey + "`<='" + whereData[key][orKey].lte + "'";
                        }

                        if(whereData[key][orKey].like){
                            whereString += " or `" + orKey + "`like '%" + whereData[key][orKey].like + "%'";
                        }
                    } else{
                        whereString += " or `" + orKey + "`= '" + whereData[key][orKey] + "'";
                    }
                }
                whereString += " ) ";
            }else if(typeof(whereData[key]) == 'object'){
                if(whereData[key].gt){
                    whereString += " and `" + key + "`>'" + whereData[key].gt + "'";
                } else if(whereData[key].gte){
                    whereString += " and `" + key + "`>='" + whereData[key].gte + "'";
                }

                if(whereData[key].lt){
                    whereString += " and `" + key + "`<'" + whereData[key].lt + "'";
                } else if(whereData[key].lte){
                    whereString += " and `" + key + "`<='" + whereData[key].lte + "'";
                }

                if(whereData[key].like){
                    whereString += " and `" + key + "` like '%" + whereData[key].like + "%'";
                }
                if(whereData[key].in){
                    whereString += " and `" + key + "` in (" + whereData[key].in + ")";
                }
                if(whereData[key].between){
                    if((whereData[key].between.lt || whereData.between.lte) && (whereData[key].between.gt || whereData.between.gte)){
                        if(whereData[key].between.lt){
                            whereString += " and `" + key + "`<'" + whereData[key].between.lt + "'";
                        }else{
                            whereString += " and `" + key + "`<='" + whereData[key].between.lte + "'";
                        }

                        if(whereData[key].between.gt){
                            whereString += " and `" + key + "`>'" + whereData[key].between.gt + "'";
                        }else{
                            whereString += " and `" + key + "`>='" + whereData[key].between.gte + "'";
                        }
                    }
                }
            } else{
                whereString += " and `" + key + "`='" + whereData[key] + "'";
            }
        }
    }

    return whereString;
}

/**
 * 通用的通过多条件查询数据接口。
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {string} fields 查询返回的字段
 * @param {object} whereData 查询条件
 * @param {object} opt “start limit orderBy groupBy” 等参数
 * @param {Function} callback 回调函数
 **/
exports.SelectDataCommon = function(DBName, TableName, fields, whereData, opt, callback){
    SelectDataCommonImpl(DBName, TableName, fields, whereData, opt, callback);
};

/**
 * 通用的通过多条件查询数据接口。
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {string} fields 查询返回的字段
 * @param {object} whereData 查询条件
 * @param {object} opt “start limit orderBy groupBy” 等参数
 * @param {Function} callback 回调函数
 **/
function SelectDataCommonImpl(DBName, TableName, fields, whereData, opt, callback){
    if(!fields || fields.length <= 0){
        fields = "*";
    }

    var selectSQL = "select " + fields + " from`" + DBName + "`.`"  + TableName + "` ";

    selectSQL += JoinWhereString(whereData);

    if(opt && opt.orderBy){
        selectSQL += " order by " + opt.orderBy;
    }
    else{
        selectSQL += " order by update_at desc ";
    }

    if(opt && opt.groupBy){
        selectSQL += " group by " + opt.groupBy;
    }

    if(opt && opt.start && opt.limit){
        selectSQL += " limit " + opt.start + "," + opt.limit;
    }
    else if(opt && opt.limit){
        selectSQL += " limit 0," + opt.limit;
    }

    logger.debug(selectSQL);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("SelectDataCommon " + TableName + " Pool Error : " + err);
            callback(null);
            return;
        }

        conn.query(selectSQL,function(err1,rows1){
            if(err1){
                logger.error("SelectDataCommon " + TableName + " Select Error : " + err1);
                callback(null);
            }
            else{
                logger.debug("SelectDataCommon " + TableName + " : success!");
                callback(rows1);
            }

            conn.release();
        });
    });
}

/**
 * 通用的获取指定条件总数的接口。
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {string} IDFieldName 关键字字段名称
 * @param {object} whereData 查询条件
 * @param {object} opt “start limit orderBy groupBy” 等参数
 * @param {Function} callback 回调函数
 **/
exports.GetCount = function(DBName, TableName, IDFieldName, whereData, callback){
    if(!IDFieldName || IDFieldName.length <= 0){
        IDFieldName = "*";
    }

    var selectSQL = "select count(`" + IDFieldName + "`) as theCount from`" + DBName + "`.`"  + TableName + "` ";

    selectSQL += JoinWhereString(whereData);

    logger.debug(selectSQL);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("GetCount " + TableName + " Pool Error : " + err);
            callback(null);
            return;
        }

        conn.query(selectSQL,function(err1,rows1){
            if(err1){
                logger.error("GetCount " + TableName + " Select Error : " + err1);
                callback(null);
            }
            else{
                logger.debug("GetCount " + TableName + " : success!");
                callback(rows1);
            }

            conn.release();
        });
    });
};

/**
 * 通用的获取高级总数的接口。
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {string} MixFunction 混合公式
 * @param {object} whereData 查询条件
 * @param {Function} callback 回调函数
 **/
exports.GetSumAdvance = function(DBName, TableName, MixFunction, whereData, callback){
    if(!MixFunction || MixFunction.length <= 0){
        callback(null);
        return;
    }

    var selectSQL = "select sum(" + MixFunction + ") as theSum from`" + DBName + "`.`"  + TableName + "` ";

    selectSQL += JoinWhereString(whereData);

    logger.debug(selectSQL);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("GetSum " + TableName + " Pool Error : " + err);
            callback(null);
            return;
        }

        conn.query(selectSQL,function(err1,rows1){
            if(err1){
                logger.error("GetSum " + TableName + " Select Error : " + err1);
                callback(null);
            }
            else{
                logger.debug("GetSum " + TableName + " : success!");
                var result = {theSum : 0};
                if(rows1 && rows1[0] && rows1[0].theSum){
                    result.theSum = rows1[0].theSum;
                }else if(rows1 && rows1.theSum){
                    result.theSum = rows1.theSum;
                }
                callback(result);
            }

            conn.release();
        });
    });
};

/**
 * 通用的获取指定字段总数的接口。
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {string} fieldName 字段名称
 * @param {object} whereData 查询条件
 * @param {Function} callback 回调函数
 **/
exports.GetSum = function(DBName, TableName, fieldName, whereData, callback){
    if(!fieldName || fieldName.length <= 0){
        callback(null);
        return;
    }

    var selectSQL = "select sum(`" + fieldName + "`) as theSum from`" + DBName + "`.`"  + TableName + "` ";

    selectSQL += JoinWhereString(whereData);

    logger.debug(selectSQL);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("GetSum " + TableName + " Pool Error : " + err);
            callback(null);
            return;
        }

        conn.query(selectSQL,function(err1,rows1){
            if(err1){
                logger.error("GetSum " + TableName + " Select Error : " + err1);
                callback(null);
            }
            else{
                logger.debug("GetSum " + TableName + " : success!");
                var result = {theSum : 0};
                if(rows1 && rows1[0] && rows1[0].theSum){
                    result.theSum = rows1[0].theSum;
                }else if(rows1 && rows1.theSum){
                    result.theSum = rows1.theSum;
                }
                callback(result);
            }

            conn.release();
        });
    });
};

/**
 * 通用的插入多条数据到数据库函数
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {Array} dataList 数据列表
 * @param {Array} fieldList 字段列表
 * @param {Function} callback 回调函数
 */
exports.InsertDataListCommon = function(DBName, TableName, dataList, fieldList, callback){
    if(!dataList || !fieldList || fieldList.length <= 0){
        logger.error("InsertDataListCommon " + TableName + " : Null data error!");
        return;
    }
    if(dataList.length <= 0){
        //logger.debug("InsertHourMACDZeroLineResultToDB : No data in the list!");
        callback("success");
        return;
    }

    var insertSQL = "Insert into `" + DBName + "`.`" + TableName + "` (";
    for(var n = 0; n < fieldList.length; ++n){
        if(n != 0){
            insertSQL += ",";
        }
        insertSQL += "`" + fieldList[n] + "`";
    }
    insertSQL += ") values ";

    for(var i = 0; i < dataList.length; ++i){
        if(i>0)insertSQL += ",";

        insertSQL += "(";
        for(var k = 0; k < fieldList.length; ++k){
            if(k != 0){
                insertSQL += ",";
            }

            insertSQL += "'" + dataList[i][fieldList[k]] + "'";
        }
        insertSQL += ")";
    }

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("InsertDataListCommon " + TableName + " Pool Error : " + err);
            callback("failed");
            return;
        }

        conn.query(insertSQL,function(err1,rows1){
            if(err1){
                logger.error("InsertDataListCommon " + TableName + " Insert Error : " + err1);
                callback("failed");
            }
            else{
                logger.debug("InsertDataListCommon " + TableName + " : success!");
                callback("success");
            }

            conn.release();
        });
    });
};

/**
 * 通用的插入单条数据到数据库函数
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {object} insertData 数据
 * @param {Function} callback 回调函数
 **/
exports.InsertDataCommon = function(DBName, TableName, insertData, callback){
    if(!insertData){
        logger.error("InsertDataCommon : NULL insertData recv!");
        callback("failed");
        return;
    }

    var insertSQL = "Insert into `" + DBName + "`.`" + TableName + "` (";
    var valueStr = ") values (";
    var insertDataCount = 0;
    var beFirst = true;
    for(var key in insertData){
        if(!beFirst){
            insertSQL += ",";
            valueStr += ",";
        }
        else{
            beFirst = false;
        }
        insertDataCount++;
        insertSQL += "`" + key + "`";
        valueStr += "'" + insertData[key] + "'";
    }

    if(insertDataCount <= 0){
        logger.error("InsertDataCommon : No insertData recv!");
        callback("failed");
        return;
    }

    insertSQL = insertSQL + valueStr + ")";

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("InsertDataCommon " + TableName + " Pool Error : " + err);
            callback("failed");
            return;
        }

        conn.query(insertSQL,function(err1,rows1){
            if(err1){
                logger.error("InsertDataCommon " + TableName + " Insert Error : " + err1);
                callback("failed");
            }
            else{
                logger.debug("InsertDataCommon " + TableName + " : success!");
                callback("success");
            }

            conn.release();
        });
    });
};

/**
 * 通用的插入单条数据到数据库函数，返回新插入数据的ID（适用于有且只有一个自增主键）
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {string} IDFieldName 唯一自增主键字段名称
 * @param {object} insertData 数据
 * @param {Function} callback 回调函数
 **/
exports.InsertDataCommonReturnID = function(DBName, TableName, IDFieldName, insertData, callback){
    this.InsertDataCommon(DBName, TableName, insertData, function(res){
        if(res != "success"){
            callback(-1);
            return;
        }

        SelectDataCommonImpl(DBName, TableName, IDFieldName, insertData, null, function(rows){
            if(rows.length <= 0){
                callback(-1);
            }
            else{
                callback(rows[0][IDFieldName]);
            }
        });
    });
};

/**
 * 通用的更新数据到数据库函数
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {object} updateData 数据列表
 * @param {object} whereData 更新数据的条件
 * @param {Function} callback 回调函数
 **/
exports.UpdateDataCommon = function(DBName, TableName, updateData, whereData, callback){
    if(!updateData){
        logger.error("UpdateDataCommon : NULL updateData recv!");
        callback("success");
        return;
    }

    var updateSQL = "update `" + DBName + "`." + TableName + " set ";
    var updateDataCount = 0;
    var beFirst = true;
    for(var key in updateData){
        if(!beFirst){
            updateSQL += ",";
        }
        else{
            beFirst = false;
        }
        updateDataCount++;
        if(typeof(updateData[key]) == 'object') {
            if(updateData[key].up != null){
                updateSQL += "`" + key + "`=`" + key + "`+" + updateData[key].up + "";
            } else if(updateData[key].down != null){
                updateSQL += "`" + key + "`=`" + key + "`-" + updateData[key].down + "";
            }
            if(updateData[key].math != null){
                updateSQL += "`" + key + "` = (" + updateData[key].math + ")";
            }
        } else{
            updateSQL += "`" + key + "`='" + updateData[key] + "' ";
        }
    }

    if(updateDataCount <= 0){
        logger.error("UpdateDataCommon : No updateData recv!");
        callback("success");
        return;
    }

    updateSQL += JoinWhereString(whereData);

    logger.debug(updateSQL);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("UpdateDataCommon " + TableName + " Pool Error : " + err);
            callback("failed");
            return;
        }

        conn.query(updateSQL,function(err1,rows1){
            if(err1){
                logger.error("UpdateDataCommon " + TableName + " Update Error : " + err1);
                callback("failed");
            }
            else{
                logger.debug("UpdateDataCommon " + TableName + " : success!");
                if(rows1 && rows1.affectedRows > 0){
                    callback("success");
                }else{
                    callback("failed");
                }
            }

            conn.release();
        });
    });
};

/**
 * 通用的删除数据接口
 * @param {string} DBName 数据库名称
 * @param {string} TableName 数据表名称
 * @param {object} whereData 条件
 * @param {Function} callback 回调函数
 **/
exports.DeleteCommon = function(DBName, TableName, whereData, callback){
    var delSQL = "delete FROM `" + DBName + "`.`" + TableName + "` ";
    delSQL += JoinWhereString(whereData);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("DeleteCommon " + TableName + " Pool Error : " + err);
            callback("failed");
            return;
        }

        conn.query(delSQL,function(err1,rows1){
            if(err1){
                logger.error("DeleteCommon " + TableName + " Error : " + err1);
                callback("failed");
            }
            else{
                logger.debug("DeleteCommon " + TableName + " : success!");
                callback("success");
            }

            conn.release();
        });
    });
};

//*********************Test Code***************
/**
 * 测试mysql 事务处理
 * @param {Array} queryList 要执行的事务列表
 * @param {Function} callback 回调函数
 */
exports.EXETransaction = function(queryList, callback){
    if(!queryList){
        logger.error("EXETransaction : Null queryList error!");
        callback('failed');
        return;
    }

    if(queryList.length <= 0){
        logger.debug("Nothing to be executing!");
        callback('success');
        return;
    }

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("EXETransaction Get Connection Error : " + err);
            callback('failed');
            return;
        }

        conn.beginTransaction(function(err) {
            if(err) {
                logger.error('EXETransaction beginTransaction Error : ' + err);
                callback('failed');
                conn.release();
                return;
            }

            var bErr = false;

            var proxy = new EventProxy();
            proxy.after('query_list', queryList.length, function(res){
                if(bErr){
                    conn.rollback(function(res){
                        logger.debug("EXETransaction rollback End : " + res);
                        callback('failed');
                        conn.release();
                    });
                }
                else{
                    conn.commit(function(commitErr){
                        if(commitErr){
                            logger.error("EXETransaction Commit Failed!!");
                            callback('success');
                            conn.rollback();
                        }
                        else{
                            logger.debug("EXETransaction Commit Success!!");
                            callback('success');
                        }

                        conn.release();
                    });
                }
            });

            for(var i = 0; i < queryList.length; ++i){
                conn.query(queryList[i],function(err1,rows1){
                    if(err1){
                        logger.error("EXETransaction Query ERR : " + err1);
                        bErr = true;
                    }

                    proxy.emit('query_list');
                });
            }
        });
    });
};

/**
 * 通用执行Sql函数
 * @param {string} sql sql语句
 * @param {Function} callback 回调函数
 **/
exports.ExeCommon = function(sql, callback){
    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("ExeCommon Pool Error : " + err);
            callback("failed");
            return;
        }

        conn.query(sql,function(err1,rows1){
            if(err1){
                logger.error("ExeCommon Error : " + err1);
                callback("failed");
            }
            else{
                logger.debug("ExeCommon : success!");
                callback("success");
            }

            conn.release();
        });
    });
};

/**
 * 通用的通过多条件查询数据接口。
 * @param {string} sql sql语句
 * @param {Function} callback 回调函数
 **/
exports.SelectSQLCommon = function(sql, callback){
    logger.debug(sql);

    pool.getConnection(function (err, conn) {
        if (err){
            logger.error("SelectSQLCommon Pool Error : " + err);
            callback(null);
            return;
        }

        conn.query(sql,function(err1,rows1){
            if(err1){
                logger.error("SelectSQLCommon Select Error : " + err1);
                callback(null);
            }
            else{
                logger.debug("SelectSQLCommon : success!");
                callback(rows1);
            }

            conn.release();
        });
    });
};