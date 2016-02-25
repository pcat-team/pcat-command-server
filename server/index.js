var express = require('express')
var path = require('path')
var compress = require('compression')
var http = require('http')
var URL = require('url')
var qs = require('querystring')
var multer = require('multer')
var router = express.Router()
var bodyP = require('body-parser')
var fs  = require('fs')

var app = express()
var _THIS_DIR = process.cwd()
var _PORT = process.argv[2]
console.log(_PORT)
var _STATIC = path.join(_THIS_DIR,'/static/')
var _PAGE = path.join(_THIS_DIR,'/page/')
var _TEMP = path.join(_THIS_DIR,'/template/')
var _MAP = path.join(_THIS_DIR,'/map/')
var _OUTPUT = path.join(_THIS_DIR, '../_output/')
var _DEV = path.join(_THIS_DIR, '../dev/')
var _OL = path.join(_THIS_DIR, '../ol/')
  //通常 logErrors 来纪录诸如 stderr, loggly, 或者类似服务的错误信息：

var logErrors = function(err, req, res, next) {
    console.error(err.stack);
    next(err);
  }
  //clientErrorHandler 定义如下（注意错误非常明确的向后传递了）：

var clientErrorHandler = function(err, req, res, next) {
    if (req.xhr) {
      res.status(500).send({
        error: 'Something blew up!'
      });
    } else {
      next(err);
    }
  }
  //下面的 errorHandler "捕获所有" 的异常，定义如下:

var errorHandler = function(err, req, res, next) {
  res.status(500);
  res.render('error', {
    error: err
  });
}
var soketRes
// process.setMaxListeners(50);
// http.createServer(function(req,res){
//   req.setMaxListeners(50);
//   res.setMaxListeners(50);
//   res.writeHead(200,{
//     'Access-Control-Allow-Origin':'*',
//     'Content-Type':'text/event-stream',
//     "Cache-Control":"no-cache",
//     "Connection":"keep-alive"
//   });
//   soketRes = res
// }).listen(8033);


app.use(bodyP.json())
app.use(bodyP.urlencoded({
    extended: !0
  }))
  // app.use(multer())
app.use(compress())


router.route('/proxy.json')
  .all(function(req, res, next) {
    res.set({
      // 'Content-Type': 'text/plain',
      // 'Content-Length': '123',
      // 'ETag': '12345'
      "Access-Control-Allow-Origin": "*"
    })
    console.log(req.query.url, req.body.url)
    if (!req.query.url && !req.body.url) {
      return res.end('这里并没有什么秘密噢。~喵！（带上参数才能进行代理啊魂蛋。）')
    } else {
      next()
    }
  }).get(function(req, res, next) {
    console.log('get start')
    var _url = 'http://' + req.query.url,
      url
    var callback = req.query.callback
    delete req.query.url
    if (!!~_url.indexOf('?')) url = _url + '&' + qs.stringify(req.query);
    else url = _url + '?' + qs.stringify(req.query);
    new Promise(function(resolve, reject) {
      var pReq = http.get(url, function(pRes) {
        var data = '',
          pData

        pRes.on('data', function(chunk) {
          data += chunk
        })
        pRes.on('end', function(err) {
          if (err) return reject({
            error: "-1",
            info: err
          });
          else {
            data = data.replace(/[\r\n]*/g, '').replace(
              /.*?\((\{.*?\})\)\;*/,
              function() {
                if (arguments[1]) return arguments[1];
                return arguments[0];
              })
            try {
              pData = JSON.parse(data)
            } catch (e) {
              var error = new Error(e)
              return reject({
                error: -1,
                info: error,
                jinc_say: 'json parse error',
                parseError: data
              })
            }

            if (callback) return resolve(['jsonp', pData])
            else {
              return resolve(['json', pData])
            }
          }
        })
      }).on('error', function(e) {
        reject({
          error: "-2",
          info: e
        });
      })
      pReq.end()
    }).then(function(dataAry) {
      res[dataAry[0]](dataAry[1])
      console.log(dataAry)
    }).catch(function(error) {
      res.json(error)
    })
  }).post(function(req, res, next) {
    console.log('post start')
    var url = 'http://' + req.body.url
    var option = URL.parse(url)
    option.method = 'POST'
    var headers = req.headers
    option.headers = {
      Host: option.host,
      // 'Content-Length': +headers['content-length'],
      'Origin': option.host,
      Cookie: req.body.cookie
    }
    delete req.body.cookie
    delete req.body.url
    var postData = qs.stringify(req.body)
    var _length = postData.length
    option.headers['Content-Length'] = _length


    new Promise(function(resolve, reject) {
      var pReq = http.request(option, function(pRes) {
        var data = '',
          pData

        pRes.on('data', function(chunk) {
          data += chunk
        })
        pRes.on('end', function(err) {
          if (err) return reject({
            error: "-1",
            info: err
          });
          else {
            data = data.replace(/[\r\n]*/g, '').replace(
              /.*?\((\{.*?\})\)\;*/,
              function() {
                if (arguments[1]) return arguments[1];
                return arguments[0];
              })
            try {
              pData = JSON.parse(data)
            } catch (e) {
              var error = new Error(e)
              return reject({
                error: -1,
                info: error,
                jinc_say: 'json parse error',
                parseError: data
              })
            }
            return resolve(['json', pData])
          }
        })
      }).on('error', function(e) {
        reject({
          error: "-2",
          info: e
        });
      })
      pReq.write(postData || '')
      pReq.end()
    }).then(function(dataAry) {
      res[dataAry[0]](dataAry[1])
    }).catch(function(error) {
      res.json(error)
    })
  })
app.use(router)
// app.use(editRouter)
// app.use(express.static(_OUTPUT));
app.use('/api/:project/:type/:api', function(req, res) {
  // var params = req.params.project.split('-')
  // var project = params[0]
  // var type = params[1]
  // var api = params[2]

  var project = req.params.project
  var type = req.params.type
  var api = req.params.api

  var file = path.resolve(_DEV, './' + project, './source/api/', './' + api)
  var date = require(file).data
  res[type](date)
    // console.log(params)
    // res.end(file)
    // data = null
})

// app.use('/',express.static('./'))
var fileCache = {}
var isMalicious = function(filepath) {
    var ext = path.extname(filepath);
    return ext !== '.css' && ext !== '.js' || filepath.indexOf('../') !== -1;
}

app.use('/', express.static(_STATIC))
app.use('/', express.static(_PAGE))
app.use('/', express.static(_TEMP))
app.use('/map/', express.static(_MAP))
app.use('/_output/', express.static(_OUTPUT))
app.use('/dev/', express.static(_DEV))
app.use('/ol/', express.static(_OL))
  // app.get('/t',function(req,res){
  //   res.end(_PORT)
  // })
app.get('/JinC', function(req, res) {
  res.end('Bad Boy,Bad Boy.')
})
app.use('/',function(req,res,next){
  if(!~req.originalUrl.indexOf('??'))return next();
  var urls = req.originalUrl.split('??')
  var files = urls[1].replace(/\&.*/,'').split(',')
  var root = path.join(_STATIC,urls[0])
  var contents = []
  ext = path.extname(req.originalUrl);
  if(ext)res.type(ext.slice(1));
  files.forEach(function (file) {
      if (fileCache.hasOwnProperty(file)) return contents.push(fileCache[file]);
      if (isMalicious(file)) return console.error('[combo] malicious file: ' + file);
      var filePath = path.join(root, file),
          content;
      try {
          content = fs.readFileSync(filePath, 'utf-8');
      } catch (e) {
          console.error('[combo] cannot read file: ' + filePath + '\n', e.stack);
      }
      if (content) contents.push(fileCache[file] = content);
  })
  rs = contents.join('\n');
  if (contents.length !== files.length) {
      console.error('[combo] some files not found');
  }
  res.send(rs);
})
console.log(path.resolve('./'))
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
var server = app.listen(_PORT || 8090, function() {
  console.info('Listening on port %d', server.address().port);
  console.info('Use "pcat open [project]" to open brower', server.address().port)
});