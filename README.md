# js-intellisense README

从版本3.0.0开始，本插件开始使用javascript分析引擎tern.js进行分析，[tern.js的文档](http://ternjs.net/doc/manual.html),tern.js使用的js静态抽象语法树是[acorn](https://github.com/acornjs/acorn)
## 功能
1. 自动提示对象的属性
2. 分析是对象属性还是方法
3. 结合ternjs进行了部分扩展，requirejs的时候，在模块中用window中的对象定义的时候，在使用的模块，不能分析出window中的该对象的属性

## 待完成
1. 查找引用
2. 查找定义

## 配置说明
在根目录添加 `.tern-project` 的配置文件，具体的配置介绍请查看tern文档，例子如下
   ```
   {
  "libs": [
    "browser",
    "jquery"
  ],
  "loadEagerly": [
  ],
  "plugins": {
    "requirejs": {
      "baseURL": "./",
      "paths": {
        "utils":"js/_ccj_/utils"
      }
    }
  }
}
   ```


## vsce 命令简介
    插件打包需要使用微软的工具，vsce，安装方法：npm install -g vsce
### 帮助命令
```
vsce --help
```
### 创建发布账户
```
vsce create-publisher shannonliang
```

### 发布语句，当前例子版本号（1.0.0）

+ 执行发布，需要手动修改版本号
    ```
    vsce publish
    ```
+ 执行发布，自动修改版本号 (2.0.0)
    ```
    vsce publish major
    ```
+   执行发布，自动修改版本号 (1.1.0)
    ```
    vsce publish minor
    ```
+ 执行发布，自动修改版本号(1.0.1)
    ```
    vsce publish patch
    ```
