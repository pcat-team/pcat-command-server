var _ = fis.util;
var server = require('./lib/server.js');
var util = require('./lib/util.js');
var fs = require('fs')
var path = require('path')
var commonConfig = {api:'cms.{{site}}.com.cn'}
// try{
//   commonConfig = require(path.resolve(fis.project.getTempPath(),'_config.js'))
// }catch(e){
//   commonConfig = {}
//   fis.log.warn(`You Cant preview template of cms --> _config.js`.red.bold)
// }
exports.name = 'server <command> [options]';
exports.desc = '内置服务器';
exports.options = {
  '-h, --help': 'print this help message',
  '-p, --port <int>': 'server listen port',
  '--root <path>': 'document root',
  '--www <path>': 'alias for --root',
  '--type': 'specify server type',
  '--timeout <seconds>': 'start timeout',
  '--https': 'start https server',
  '--no-browse': 'do not open a web browser.',
  '--no-daemon': 'do not run in background.',
  '--include <glob>': 'clean include filter',
  '--exclude <glob>': 'clean exclude filter'
};
exports.commands = {
  'start': 'start server',
  'stop': 'shutdown server',
  'restart': 'restart server',
  'info': 'output server info',
  'open': 'open document root directory',
  'clean': 'clean files in document root',
};

exports.run = function(argv, cli, env) {

  // 显示帮助信息
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options, exports.commands);
  }

  if (!validate(argv)) {
    return;
  }

  // 因为 root 被占用了，所以这里暂且允许通过 --www 来指定。
  if (argv.www) {
    argv.root = argv.www;
    delete argv.www;
  }

  // short name
  if (argv.p && !argv.port) {
    argv.port = argv.p;
    delete argv.p;
  }
  var thisProject = fis.project.getProjectPath()

  var site = thisProject.replace(/.*?(geekev||pc(?:auto|online|baby|lady|house|games)).*/ig,'$1') || ''

  var _version;
  var client;
  var dir;
  var cmd = argv._[1];
  var cmd_project = argv._[2]
  if(!cmd_project){
    try{
      var __json = JSON.parse(fs.readFileSync(path.resolve(thisProject,'package.json')))
      thisProject = __json.name
      _version = __json.version + '/'
      client = __json.client+"/";
      dir = __json.dir ?__json.dir+"/":"";
    }catch(e){
      thisProject = ''
      site = ''
    }
  }
  var _project = cmd_project || thisProject
  var serverInfo = util.serverInfo() || {};
  delete argv['_'];
  var options = _.assign({
    _project:site ? _project : '',
    _client:client || "",
    _dir:dir || "",
    _version: _version || '',
    _site: site ? site + '/' : '',
    type: fis.get('server.type', 'node'),

    // 每次 start 的时候，root 都需要重新指定，否则使用默认 document root.
    root: cmd === 'start' ? util.getDefaultServerRoot() : (serverInfo.root || util.getDefaultServerRoot()),

    api:commonConfig.api,
    port: 8080,
    timeout: 30, // 30 秒
    browse: true,
    daemon: argv['no-daemon'] === void 0 ? !0 : !1,
    https: false
  }, argv);

  // 如果指定的是文件，则报错。
  if (fis.util.exists(options.root)) {
    if (!fis.util.isDir(options.root)) {
      fis.log.error('invalid document root `%s` is not a directory.', options.root);
    }
  } else {
    fis.util.mkdir(options.root);
  }

  options.root = fis.util.realpath(options.root);

  // set options to server.
  server.options(options);

  switch (cmd) {
    case 'restart':
      server.stop(server.start.bind(server));
      break;

    case 'start':
    case 'stop':
    case 'info':
    case 'open':
    case 'clean':
      server[cmd].call(server);
      break;

    default:
      cli.help(exports.name, exports.options, exports.commands);
      break;
  }
};

// 占位
// 验证参数是否正确。
function validate() {
  return true;
}
