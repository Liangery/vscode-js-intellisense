# js-intellisense README
    
## 配置说明
    basePath : 基础智能提示解析文件目录
    includeFiles : 需要解析的具体文件，当有此配置项的时候，其他文件不会被解析。属性path和files，需要配置。
    excludeFiles: 不需要解析的文件，有此配置的时候，该文件不会被解析。可以配置jquery，等等基础的文件。
    globalObject : 全局的对象索引，优先级比较高，如果你输入了改对象，并且输入'.'进行智能提示的时候，会先按照此配置项，进行提示。

## publish
发布使用 vsce 需要向安装

```bash
# 创建发布账户
vsce create-publisher shannonliang
# token 需要联系我提供
 

# 发布
npm run publish
or
npm run minor
or 
npm run major
or
npm run patch
```
