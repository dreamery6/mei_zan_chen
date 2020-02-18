/**
 * Created by Johnny on 2016/3/15.
 */
var logger = require('../common/logger');
var md5 = require('md5');
var config = require('../config');

var wxPayConfig = {
    AppAppID : 'wxbdc4b142651a5396',
    appID : config.wxPay.appId,
    wxpaykey : config.wxPay.partnerKey,
    AppWxPayKey : 'BingoRedPacket88BingoRedPacket99'
};

exports.wxPayNotify = function(params, tradeData, callback){
    logger.debug('[WxpayNotify-wxPayNotify] : Get wxPay Notify : ' + JSON.stringify(params));

    var return_code = params.return_code[0];
    if('SUCCESS' != return_code ) {
        logger.error("[WxpayNotify-wxPayNotify] : wxPay verify error: return_code = " + return_code);
        callback(false);
        return;
    }

    //String	通知校验ID。	不可空
    var appID = params.appid[0];
    var tradeType = params.trade_type[0];
    if(appID != wxPayConfig.appID && tradeType != 'APP') {
        logger.error("[WxpayNotify-wxPayNotify] : wxPay verify error: appID = " + appID);
        callback(false);
        return;
    }

    if(appID != wxPayConfig.AppAppID && tradeType == 'APP') {
        logger.error("[WxpayNotify-wxPayNotify] : wxPay verify error: app appID = " + appID);
        callback(false);
        return;
    }

    if(tradeData.TradeAmount != params.total_fee[0]){
        logger.fatal("[WxpayNotify-wxPayNotify] : wxPay verify error: TotalFee Error : " + params.total_fee[0]);
        callback(false);
        return;
    }

    //对微信签名信息进行验证
    if (sign(params) != true ) {
        logger.fatal("[WxpayNotify-wxPayNotify] : wxPay verify error: checkSign Error.");
        callback(false);
        return;
    }

    //Todo
    //保存数据库

    callback(true);
};

function sign(param) {
    var wxPayKey = wxPayConfig.wxpaykey;
    if(param.trade_type[0] == 'APP'){
        wxPayKey = wxPayConfig.AppWxPayKey;
    }
    var queryString = Object.keys(param).filter(function(key){
            return param[key] !== undefined && param[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key)<0;
        }).sort().map(function(key){
            return key + '=' + param[key];
        }).join("&") + "&key=" + wxPayKey;

    var signStr = md5(queryString).toUpperCase();

    return (param['sign'][0] === signStr);
}
