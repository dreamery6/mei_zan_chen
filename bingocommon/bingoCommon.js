/**
 * Created by Johnny on 2016/3/7.
 */

//增加时间类Date对apiCloud返回的时间格式的构造函数

var SHA1 = require('../middlewares/SHA1');
var logger = require('../common/logger');
var config = require('../config');
var createNumber = require('./createNewNumber');

Date.prototype.Format = function(fmt) { //author: meizz
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
};

exports.IsTime = function(theTime){
    if(theTime == null){
        return false;
    }
    else if(theTime.length < 24){
        return false;
    }
    else if(theTime.substring(10, 11) != 'T'){
        return false;
    }
    else if(theTime.substring(23, 24) != 'Z'){
        return false;
    }

    return true;
}


exports.APIDateToJsDate = function(apiDate){
    if(!this.IsTime(apiDate)){
        return null;
    }

    var returnDate = new Date(apiDate);
    return returnDate;
};

exports.JsDateToString = function(jsDate, withTime, withMs){
    if(jsDate == null)
        return "";

    var returnCode = jsDate.getFullYear();
    returnCode += "-" + this.NumberToString(jsDate.getMonth() + 1, 2);
    returnCode += "-" + this.NumberToString(jsDate.getDate(), 2);

    if(withTime){
        returnCode += " " + this.NumberToString(jsDate.getHours(), 2);
        returnCode += ":" + this.NumberToString(jsDate.getMinutes(), 2);
        returnCode += ":" + this.NumberToString(jsDate.getSeconds(), 2);
        if(withMs == true)
            returnCode += " " + this.NumberToString(jsDate.getMilliseconds(), 3);
    }

    return returnCode;
};

exports.APIDateToString = function(apiDate, withTime, withMs){
    var jsDate = this.APIDateToJsDate(apiDate);

    return this.JsDateToString(jsDate, withTime, withMs);
};

exports.NumberToString = function(number, length){
    if(length <= 1)
        return number;
    if(number < 0)
        return number;

    var numStr = "";
    if(number>=0 && number < 10){
        for(var i = 0; i < length - 1; ++i){
            numStr += "0"
        }
        numStr += number;
    }

    if(number>=10 && number < 100){
        for(var i = 0; i < length - 2; ++i){
            numStr += "0"
        }
        numStr += number;
    }

    if(number>=100 && number < 1000){
        for(var i = 0; i < length - 3; ++i){
            numStr += "0"
        }
        numStr += number;
    }

    return numStr;
};

exports.GetCurrentDate = function(){
    var currentDate = new Date;

    var returnCode = currentDate.getFullYear();
    returnCode += "-" + this.NumberToString(currentDate.getMonth() + 1, 2);
    returnCode += "-" + this.NumberToString(currentDate.getDate(), 2);

    return returnCode;
};

exports.GetCurrentDateTime = function(withMs){
    var currentDate = new Date;

    var returnCode = currentDate.getFullYear();
    returnCode += "-" + this.NumberToString(currentDate.getMonth() + 1, 2);
    returnCode += "-" + this.NumberToString(currentDate.getDate(), 2);
    returnCode += " " + this.NumberToString(currentDate.getHours(), 2);
    returnCode += ":" + this.NumberToString(currentDate.getMinutes(), 2);
    returnCode += ":" + this.NumberToString(currentDate.getSeconds(), 2);
    if(withMs == true)
        returnCode += " " + this.NumberToString(currentDate.getMilliseconds(), 3);

    return returnCode;
};

exports.GetCurrentTime = function(withMs){
    var currentDate = new Date;

    var returnCode = this.NumberToString(currentDate.getHours(), 2);
    returnCode += ":" + this.NumberToString(currentDate.getMinutes(), 2);
    returnCode += ":" + this.NumberToString(currentDate.getSeconds(), 2);
    if(withMs == true)
        returnCode += " " + this.NumberToString(currentDate.getMilliseconds(), 3);

    return returnCode;
};

exports.GetCurrentTimeNumber = function(){
    var currentDate = new Date;

    var returnCode = currentDate.getHours() * 60 * 60;
    returnCode += currentDate.getMinutes() * 60;
    returnCode += parseInt(currentDate.getSeconds());

    return returnCode;
};

exports.DateTimeCutMs = function(dateWithMs){
    if(dateWithMs.length !=23)return;

    return dateWithMs.substring(0, dateWithMs.length-4);
};

exports.toJson = function(data){
    return eval("(" + data + ")");
};

//返回[begin, end)的随机数 包括begin，不包括end
exports.GetRandomNumber = function(begin,end){
    return Math.floor(Math.random()*(end-begin))+begin;
};

//返回[begin, end)的随机浮点数 包括begin，不包括end
exports.GetRandomFloat = function(begin,end){
    return Math.random()*(end-begin)+begin;
};

//返回 0-9 + a-z 的随机字符
exports.GetRandomNumberAndLower = function(){
    var theCodeList = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h',
                       'i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];

    var ranNumber = this.GetRandomNumber(0,36);

    return theCodeList[ranNumber];
};

exports.NumberToStringBeginWithZero = function (number, length){
  var numberS = String(number);
  var result;
  if (numberS.length < length) {
    result = '0'.repeat(length - numberS.length) + numberS;
  } else {
    result = numberS;
  }
  return result;
};

//根据重量计算韵达快递费用， 重量单位克，费用单位分
exports.GetYunDaFare = function (weight){
    var fare;
    if(weight <= 0){
        fare = 0;
    }else if(weight <= 1000){
        fare = 1100;
    }else{
        var leftWeight = Math.ceil((weight-1000)/100);
        fare = 1100 + leftWeight*50;
    }

    return fare;
};

var suffix = 'travelchat'; //serverKey的后缀

//计算校验码
function GetRequestKeyImpl(req){
    if(!req || !req.requestType || !req.requestID || !req.ect || !req.requestTime){
        return null;
    }
    var requestType = req.requestType;
    var requestID = req.requestID;
    var encryptType = req.ect;
    var requestTime = req.requestTime;

    //如果是不用加密， 校验码为空
    if (encryptType == 0) {
        return null;
    }
    //ect == 1代表使用SHA1加密
    else if (encryptType == 1) {
        var serverKey = config.SERVER_KEY + suffix;
        var reqSHA1 = SHA1.SHA1(serverKey + "BG" + requestType + "BG" + requestID + "BG" + requestTime);
        return reqSHA1;
    }
}

exports.GetRequestKey = function(req){
   return GetRequestKeyImpl(req);
};

//判断校验码是否正确
exports.CheckBingoRequest = function(req) {
    var requestType = req.requestType;
    var requestID = req.requestID;
    var encryptType = req.ect;
    var requestTime = req.requestTime;
    var reqKey = req.requestKey;

    if (encryptType == 0) {
        logger.debug("[Main-CheckBingoRequest] : No encrypt! requestType = " + requestType);
        return true;
    }
    //ect == 1代表使用SHA1加密
    else if (encryptType == 1) {
        var serverKey = config.SERVER_KEY + suffix;
        var reqSHA1 = SHA1.SHA1(serverKey + "BG" + requestType + "BG" + requestID + "BG" + requestTime);
        if (reqKey == reqSHA1) {
            logger.debug("[Main-CheckBingoRequest] : SHA1 decrypt pass! requestType = " + requestType);
            return true;
        }
        else {
            logger.error("[Main-CheckBingoRequest] : SHA1 decrypt fail pass! requestType = " + requestType);
            return false;
        }
    }

    logger.error("[Main-CheckBingoRequest] : invalid encrypt = " + encryptType + ", requestType = " + requestType);
    return false;
};

//获取内部通讯的包头
//encryptType : 0 不加密 1 SHA1加密
exports.GetRequestHead = function(requestType, encryptType){
    var now = new Date();
    var reqData = {
        requestType : requestType,
        requestID : createNumber.CreateNew32String(),
        ect : encryptType,
        requestTime : Math.floor(now.getTime()/1000)
    };

    reqData.requestKey = GetRequestKeyImpl(reqData);

    return reqData;
};

//删除空对象
exports.deleteEmptyProperty = function(object){
    for (var i in object) {
        var value = object[i];
        if (typeof value === 'object') {
            this.deleteEmptyProperty(value);
            if (isEmptyImpl(value)) {
                delete object[i];
            }
        } else {
            if (value === null || value === undefined) {
                delete object[i];
            }
        }
    }
};

function isEmptyImpl(object) {
    for (var name in object) {
        return false;
    }
    return true;
}

exports.isEmpty = function(object){
    return isEmptyImpl(object);
};

exports.maskPhone = function(phone){
    if (!phone) {
        return "";
    }

    let number = phone.slice(-11);
    return number.substring(0, 3) + "****" + number.substring(7,12);
}


exports.getDays = function (strDateStart,strDateEnd){
    var strSeparator = "-"; //日期分隔符
    var oDate1;
    var oDate2;
    var iDays;
    oDate1= strDateStart.split(strSeparator);
    oDate2= strDateEnd.split(strSeparator);
    var strDateS = new Date(oDate1[0], oDate1[1]-1, oDate1[2]);
    var strDateE = new Date(oDate2[0], oDate2[1]-1, oDate2[2]);
    iDays = parseInt(Math.abs(strDateS - strDateE ) / 1000 / 60 / 60 /24);//把相差的毫秒数转换为天数
    return iDays + 1;
}

exports.checkDate = function (dateStr){
    var a = /^(\d{4})-(\d{2})-(\d{2})$/
    if (!a.test(dateStr)) {
        return false
    }else{
        return true;
    }
}

exports.uniqueArr =function (arr) {
    return Array.from(new Set(arr))
}

exports.getArrDifference = function(arr1, arr2) {
    return arr1.concat(arr2).filter(function(v, i, arr){
        return arr.indexOf(v) === arr.lastIndexOf(v);
    });
}

exports.spliceUrl = function(fileName){
    if(!fileName){
        return fileName;    
    }
    if(/^http/.test(fileName) == false){
        let startLength = fileName.lastIndexOf(".");
        if(startLength == -1){
            return fileName;
        }
        let suffix = fileName.substr(startLength + 1, fileName.length + 1);
        if(suffix == "mp4"){
            fileName = config.qiniu.url.video[Math.ceil(Math.random()*config.qiniu.url.video.length) - 1] + fileName;
        }else{
            fileName = config.qiniu.url.img[Math.ceil(Math.random()*config.qiniu.url.img.length) - 1] + fileName;
        }
    }
    return fileName;
}