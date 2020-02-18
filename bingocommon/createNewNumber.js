/**
 * Created by Johnny on 2016/3/8.
 */

var bingoCommon = require('../bingocommon/bingoCommon');
var postfix = 100001;

exports.GetNewTradeNo = function(){
    var currentDate = new Date;

    var newTradeNo = currentDate.getFullYear();
    newTradeNo += bingoCommon.NumberToString(currentDate.getMonth() + 1, 2);
    newTradeNo += bingoCommon.NumberToString(currentDate.getDate(), 2);
    newTradeNo += bingoCommon.NumberToString(currentDate.getHours(), 2);
    newTradeNo += bingoCommon.NumberToString(currentDate.getMinutes(), 2);
    newTradeNo += bingoCommon.NumberToString(currentDate.getSeconds(), 2);
    newTradeNo += bingoCommon.NumberToString(currentDate.getMilliseconds(), 3);

    newTradeNo = newTradeNo + bingoCommon.GetRandomNumber(100000, 900000);
    newTradeNo = newTradeNo + postfix;

    postfix = postfix + 1;

    if(postfix > 500001){
        postfix = 100001;
    }

    return newTradeNo;
};

exports.CreateNew32String = function(){
    var currentDate = new Date;

    var newString = currentDate.getFullYear();
    newString += bingoCommon.NumberToString(currentDate.getMonth() + 1, 2);
    newString += bingoCommon.NumberToString(currentDate.getDate(), 2);
    newString += bingoCommon.NumberToString(currentDate.getHours(), 2);
    newString += bingoCommon.NumberToString(currentDate.getMinutes(), 2);
    newString += bingoCommon.NumberToString(currentDate.getSeconds(), 2);
    newString += bingoCommon.NumberToString(currentDate.getMilliseconds(), 3);

    newString = newString + bingoCommon.GetRandomNumber(100000, 900000);
    newString = newString + postfix;

    postfix = postfix + 1;

    if(postfix > 500001){
        postfix = 100001;
    }

    return newString;
};

exports.GetNewSMSCheckCode = function(){
    return bingoCommon.GetRandomNumber(100000, 999999);
};

exports.GetUniqueID = function(){
    var currentDate = new Date;

    var uniquestring = currentDate.getFullYear();
    uniquestring += bingoCommon.NumberToString(currentDate.getMonth() + 1, 2);
    uniquestring += bingoCommon.NumberToString(currentDate.getDate(), 2);
    uniquestring += bingoCommon.NumberToString(currentDate.getHours(), 2);
    uniquestring += bingoCommon.NumberToString(currentDate.getMinutes(), 2);
    uniquestring += bingoCommon.NumberToString(currentDate.getSeconds(), 2);
    uniquestring += bingoCommon.NumberToString(currentDate.getMilliseconds(), 3);

    uniquestring = uniquestring + bingoCommon.GetRandomNumber(100000, 900000);
    uniquestring = uniquestring + postfix;

    postfix = postfix + 1;

    if(postfix > 500001){
        postfix = 100001;
    }

    return uniquestring;
};