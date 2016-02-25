'use strict'
var fork = require('child_process').fork
var path = require('path')
// var server = require('./server')
var name = 'pcServer'
var dirname = path.resolve(__dirname)
exports.name = 'server'
exports.usage = '<commad> [option]'
exports.desc = 'open local server for liveaload and preview'

exports.options = {
  '-s, --start <port>': 'start a localserver with <port> || 8090',
  '-x, --stop': 'stop the loacal sertver',
  '-p, --pm2 <port>': 'pm2 start the server'
};
exports.run = function(argv, cli, env){
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options);
  }
  var command = argv._
  if(argv.p || argv.pm2){
    var pm2 = require('pm2')
    var port = argv.p === true ? 8090 : (argv.p || argv.pm2)
    // server(argv.s)
    // process._server_port_ = argv.s
    console.log('port:'+argv.p)
    pm2.connect(function() {
      pm2.start({
        name: name,
        script    : path.resolve(dirname,'./server/index.js'),         // Script to be run
        exec_mode : 'fork',        // Allow your app to be clustered
        // instances : 4,           // Optional: Scale your app by 4
        "cwd": process.cwd(),
        max_memory_restart : '100M',   // Optional: Restart your app if it reaches 100Mo
        args: [port]
      }, function(err, apps) {
        if(err) console.error(err)
        pm2.disconnect()
      });

      // pm2.start({
      //   watch: __dirname + '/socket/index.js',
      //   name: name + '_socket',
      //   script    : __dirname + '/socket/index.js',         // Script to be run
      //   exec_mode : 'fork',        // Allow your app to be clustered
      //   // instances : 4,           // Optional: Scale your app by 4
      //   "cwd": process.cwd(),
      //   max_memory_restart : '100M',   // Optional: Restart your app if it reaches 100Mo
      //   args: [port]
      // }, function(err, apps) {
      //   if(err) console.error(err)
      // });
    });
  }
  if(argv.s || argv.start){
    var port = argv.s === true ? 8090 : (argv.s || argv.start)
    var cwd = process.cwd()
    fis.log.notice('browse ' + cwd.yellow.bold + '\n')
    fis.log.notice('Hit CTRL-C to stop the server'.green.bold)
    var _c = fork(path.resolve(dirname,'./server/index.js'),[port],{
      cwd:cwd
    })
    return _c
  }
  if(argv.x || argv.stop){
    pm2.connect(function() {
      pm2.delete(name, function(err, apps) {
        pm2.disconnect();
      })
      // pm2.delete(name + '_socket', function(err, apps) {
      //   pm2.disconnect();
      // })
    });
  }
  
}
