const {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    TextDocumentSyncKind,
    CompletionItemKind
} = require("vscode-languageserver");
const fs = require("fs");
// Creates the LSP connection
const connection = createConnection(ProposedFeatures.all);
// Create a manager for open text documents
const documents = new TextDocuments();

// The workspace folder this server is operating on

documents.onDidOpen(event => {
    // connection.console.log(
    //     `[Server(${process.pid}) Document opened: ${event.document.uri}`
    // );
});
documents.listen(connection);

//文件内容改动 , 可做代码检测
documents.onDidChangeContent(change => {
    // console.log(change);
    validateTextDocument(change.document);
});
var workspacePath = "D:\\web\\mobile\\afp\\js\\_ccj_",
    initIntellisenseFiles = [],
    initIntellisenseList = [{
        label: "shannonliang",
        kind: CompletionItemKind.Text,
        data: 1
    }],
    curIntellisenseList = [],
    curIntellisenseIndex = -1,
    curConfigObj = {},
    curFindObjFlag = 0,
    initIntellisenseIndex = 0,
    configStr = '',
    baseConfig = null,
    keyWordsByObj = [], //解析当前配置的对象
    curLineIntellisenseList = [];

function initIntellisenseCompletionList() {
    var basePath = workspacePath;
    baseConfig = initIntellisenseConfig();
    //没有配置的时候，插件无效
    if (!baseConfig) {
        return;
    }
    if (baseConfig.basePath) {
        basePath = (workspacePath + '\\' + baseConfig.basePath).replace(/\//g, '\\');
    }
    if (baseConfig.includeFiles && baseConfig.includeFiles.length) {
        for (var i = 0; i < baseConfig.includeFiles.length; i++) {
            let includefilepath = baseConfig.includeFiles[i];
            let includepath = includefilepath.path ? (basePath + '\\' + includefilepath.path) : basePath;
            if(includefilepath.files && includefilepath.files.length){
                for (var j = 0; j < includefilepath.files.length; j++) {
                    let filetemp = includepath + '\\' + includefilepath.files[j];
                    findAllFile(filetemp);
                }
            }else{
                findAllFile(includepath);
            }
        }
    } else {
        findAllFile(basePath);
    }
    if(baseConfig.excludeFiles && baseConfig.excludeFiles.length){
        for(var i=0;i<baseConfig.excludeFiles.length;i++){
            let excludefilepath = baseConfig.excludeFiles[i];
            
            let excludepath = excludefilepath.path ? (basePath + '\\' + excludefilepath.path) : basePath;
            
            excludepath = excludepath.replace(/\//g, '\\');
            
            if(excludefilepath.files && excludefilepath.files.length){
                for(var j=0;j<excludefilepath.files.length;j++){
                    let filetemp = excludepath + '\\' + excludefilepath.files[j];
                    removeInitIntellisenseFiles(filetemp);
                }
            }else{
                removeInitIntellisenseFiles(excludepath);
            }
            
        }
    }

    readAllFile(initIntellisenseFiles);
}

function removeInitIntellisenseFiles(str){
    initIntellisenseFiles = initIntellisenseFiles.filter(function(v){
        if(v.indexOf(str) == -1){
            return true;
        }
    });
}

function setIntellisenseCompletionList() {
    initCurConfigObj();
    var curObj = curConfigObj;

    for (var i = 0; i < keyWordsByObj.length - curFindObjFlag; i++) {
        var tempkey = keyWordsByObj[i];
        if (tempkey == 'window') {
            if (i !== 0) {
                initCurConfigObj();
                curObj = curConfigObj;
            }
            continue;
        }
        if (!curObj[tempkey]) {
            return;
        } else {
            curObj = curObj[tempkey];
        }
    }
    // console.log(curObj);
    for (var key in curObj) {
        addcurIntellisenseList(key);
    }
}

function validateTextDocument(textDocument) {
    var textDoc = textDocument.getText();

    let lines = textDocument.getText().split(/\r?\n/g);
    if (lines.length == 0) {
        return;
    }
    let linesLen = lines.length;
    let lastLine = lines[linesLen - 1];
    // console.log('当前输入行的内容：' + lastLine);
    let curchart = lastLine[lastLine.length - 1];
    if (curchart == '.') {
        keyWordsByObj = [];
        curFindObjFlag = 0;
        let wordsobj = lastLine.match(/\w{3,}(\w|\.)*/ig);
        let lastWordObj = wordsobj[wordsobj.length - 1];
        let wordArr = lastWordObj.split('.');
        let firstWordObj = wordArr[0];
        var refObjArr = [];
        for (var i = 0; wordArr && i < wordArr.length; i++) {
            if (wordArr[i]) {
                refObjArr.push(wordArr[i]);
            }
        }
        var resultRefObj = getObjRef(textDoc, wordArr[0]);
        keyWordsByObj = resultRefObj.concat(refObjArr);
        // console.log('当前输入对象的，关键字的索引数组：'+keyWordsByObj + '  length ' + keyWordsByObj.length);
    }

    setIntellisenseCompletionList();
}

function getObjRef(str, name) {
    if (name == 'window') {
        return [];
    }
    var arr = [],
        r = getObjstr(str, name);
    if (r) {
        curFindObjFlag = 1;
        if (r.endsWith('.') && r) {
            r = r.Substring(0, r.Length - 1);
        }
        var rArr = r.split('.');
        for (var i = 1; i < rArr.length; i++) {
            arr.push(rArr[i]);
        }
        if (rArr.length == 1) {
            return rArr;
        }
        return [].concat(arguments.callee(str, rArr[0])).concat(arr);
    } else {
        return [name];
    }

}

function getObjstr(str, name) {
    str = str.replace(/,/g, ';');
    var reg = new RegExp("\\b" + name + "\\b(\\s*)=(\\s*)(.*)(\\s*)(;)");
    var strArr = str.match(reg);
    //第三个是需要匹配的值
    if (strArr && strArr.length > 2) {
        var result = strArr[3];
        var nextArr = result.match(reg);
        if (nextArr && nextArr.length > 2) {
            result = nextArr[3];
        }
        result = result.replace(/\s/g, ';').replace(/,/g, ';');
        result = result.split(';')[0];
        return result;
    }
    return null;

}

function findAllFile(dir) {
    dir = dir.replace(/\//g, '\\')
    if (isFile(dir)) {
        initIntellisenseFiles.push(dir);
        return;
    }

    var dirArr = fs.readdirSync(dir),
        _thisfn = arguments.callee;
    dirArr.forEach(function (v, i) {
        if (!v.startsWith('.')) {

            var tempdir = dir + '\\' + v;
            if (isFile(tempdir) && tempdir.endsWith('.js')) {
                initIntellisenseFiles.push(tempdir)
            } else if (isDirectory(tempdir)) {
                _thisfn(tempdir);
            }
        }
    });



}

function readAllFile(files) {

    var _jsWords = {
            "require": 1,
            "define": 1,
            "break": 1,
            "case": 1,
            "catch": 1,
            "continue": 1,
            "default": 1,
            "delete": 1,
            "do": 1,
            "else": 1,
            "finally": 1,
            "for": 1,
            "function": 1,
            "if": 1,
            "in": 1,
            "instanceof": 1,
            'new': 1,
            "return": 1,
            "switch": 1,
            "this": 1,
            "throw": 1,
            "try": 1,
            "typeof": 1,
            "var": 1,
            "void": 1,
            "while": 1,
            "with": 1
        },
        keyWords = [];
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i],
            fileDataString = readFile(file),
            words = fileDataString.match(/\w{3,}/ig),
            wordsobj = fileDataString.match(/\w{3,}(\w|\.)*/ig); //解析成带对象索引的字符串
        if (!words) {
            continue;
        }
        // console.log('start resolve filename :' + file);

        var newWords = Array.from(new Set(words));
        keyWords = keyWords.concat(newWords);

        // console.log('end resolve filename :' + file);
    }
    for (var i = 0; i < keyWords.length; i++) {
        let key = keyWords[i];
        if (!_jsWords[key] && !(/^[0-9]/.test(key))) {
            _jsWords[key] = 1;
            addIntellisenseItem(key);
        }
    }

    // console.log( '智能提示解析的关键字的长度：'+initIntellisenseList.length);
}
//检测智能提示的配置文件，只能是根目录存在的,返回基础配置的对象
function initIntellisenseConfig() {
    var configJs = workspacePath + "\\intellisenseConfig.json";
    if (!isFile(configJs)) {
        return;
    }
    configStr = readFile(configJs);
    let fileDataObj = JSON.parse(configStr);
    if (fileDataObj.globalObject) {
        curConfigObj = fileDataObj.globalObject;
    }
    return fileDataObj;
}

function initCurConfigObj() {
    curIntellisenseList = [];
    curIntellisenseIndex = -1;
    if (!configStr) {
        return;
    }
    let fileDataObj = JSON.parse(configStr);
    if (fileDataObj.globalObject) {
        curConfigObj = fileDataObj.globalObject;
    }
}

function addIntellisenseItem(text) {
    initIntellisenseIndex++;
    var item = {
        label: text,
        kind: CompletionItemKind.Text,
        data: initIntellisenseIndex
    };
    initIntellisenseList.push(item);
}

function addcurIntellisenseList(text) {
    curIntellisenseIndex++;
    var item = {
        label: text,
        kind: CompletionItemKind.Text,
        data: curIntellisenseIndex
    };
    curIntellisenseList.push(item);
}

function isDirectory(fileName) {
    if (fs.existsSync(fileName)) return fs.statSync(fileName).isDirectory();
}

function isFile(fileName) {
    if (fs.existsSync(fileName)) return fs.statSync(fileName).isFile();
}

function readFile(fileName) {
    if (fs.existsSync(fileName)) return fs.readFileSync(fileName, "utf-8");
}

//初始化设置
connection.onInitialize(params => {
    workspacePath = params.rootPath;
    // connection.console.log(
    // `[Server(${process.pid}) Started and initialize received,path  ${workspacePath}`
    // );
    initIntellisenseCompletionList();

    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [".", ":", "<", '"', "/", "@", "*"]
            },
            documentFormattingProvider: true,
            // hoverProvider: true,
            documentHighlightProvider: true,
            documentSymbolProvider: true,
            definitionProvider: true,
            referencesProvider: true,
            colorProvider: true
        }
    };
});
//监听鼠标滑过事件
// connection.onHover(textDocumentPosition => {
//     const document = documents.get(textDocumentPosition.textDocument.uri);
//     console.log(document);
// });

connection.onDocumentSymbol(documentSymbolParms => {
    const document = documents.get(documentSymbolParms.textDocument.uri);
    // console.log(document);
});
//监听定义
connection.onDefinition(definitionParams => {
    const document = documents.get(definitionParams.textDocument.uri);
    // console.log(definitionParams, "definitionParams");
});
//文档引用
connection.onReferences(referenceParams => {
    const document = documents.get(referenceParams.textDocument.uri);
    // console.log(referenceParams, "referenceParams");
});

//文档格式化
connection.onDocumentFormatting(formatParams => {
    const document = documents.get(formatParams.textDocument.uri);
    // console.log(formatParams, "formatParams");
});

connection.onDocumentHighlight(documentHighlightParams => {
    const document = documents.get(documentHighlightParams.textDocument.uri);
    // console.log('onDocumentHighlight');
});

//智能感知部分开始
connection.onCompletion(TextDocumentPositionParams => {
    // console.log(curIntellisenseList, "TextDocumentPositionParams");
    // let curLineIndex = TextDocumentPositionParams.position.line;
    // let curLineCharIndex = TextDocumentPositionParams.position.character;
    console.log(curIntellisenseIndex + "  curIntellisenseListIndex");
    if (curIntellisenseList && curIntellisenseList.length) {
        return curIntellisenseList;
    }
    return initIntellisenseList;
});
connection.onCompletionResolve(item => {
    if (item.data === 1) {
        (item.detail = "TypeScript details"),
        (item.documentation = "TypeScript documentation");
    } else if (item.data === 2) {
        (item.detail = "JavaScript details"),
        (item.documentation = "JavaScript documentation");
    }
    return item;
});
//智能感知部分结束
connection.listen();