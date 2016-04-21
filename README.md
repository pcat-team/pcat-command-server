# pcat-command-server

该插件 fork 于fis3-command-server。
```bash
$ pcat server -h
```
查看具体用法。

## 开启80端口的服务器
``` bash
$ pcat server start -p 80
```

## 停止服务器
``` bash
$ pcat server stop
```

## 打开服务器文件夹
``` bash
$ pcat server open
```

使用的服务器插件是: pcat-node-server

这里只能(默认)开启 node.js 的服务器，原来的fis3-command-server 有其他语言的服务器可用。

