var config = require('../config');

var env = process.env.NODE_ENV || "development";

/**
 * log4js 日志输出配置文件
 * @type {exports}
 */
var log4js = require('log4js');
var bingoConfig = require('../config');

// logger configure

var logFilePath = bingoConfig.logger_filePath;
if(bingoConfig.beWin){
  logFilePath = bingoConfig.win_logger_filePath;
}
log4js.configure({
  appenders: [
    {
      type: 'console'
    },
    {
      type: 'dateFile',
      filename: logFilePath,
      pattern: "_yyyy-MM-dd",
      maxLogSize: 1024*1024,
      alwaysIncludePattern: false,
      backups: 10,
      category: 'cheese'
    }
  ],
  replaceConsole: true
});

var logger = log4js.getLogger('cheese');
logger.setLevel(config.debug && env !== 'test' ? 'DEBUG' : 'ERROR');

module.exports = log4js.getLogger('cheese');
