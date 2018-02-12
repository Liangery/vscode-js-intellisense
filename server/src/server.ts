/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
    IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments, TextDocument,
    Diagnostic, DiagnosticSeverity, InitializeResult, TextDocumentPositionParams, CompletionItem,
    CompletionItemKind,
    Files
} from 'vscode-languageserver';
import { readdirSync, existsSync, statSync, readFileSync } from 'fs';
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize((_params): InitializeResult => {
    initIntellisenseCompletionList();
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true
            }
        }
    }
});


var workspacePath: string = "D:\\web\\mobile\\afp\\js\\_ccj_",
    initIntellisenseFiles: Array<string> = [],
    initIntellisenseList: Array<object> = [{
        label: "shannonliang",
        kind: CompletionItemKind.Text,
        data: 1
    }],
    curIntellisenseList: Array<object> = [],
    curIntellisenseIndex: number = -1,
    curConfigObj: object = {},
    curFindObjFlag: number = 0,
    initIntellisenseIndex: number = 0,
    configStr: string = '',

    keyWordsByObj: Array<string> = [], //解析当前配置的对象
    curLineIntellisenseList = [];

let baseConfig = null;

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
            if (includefilepath.files && includefilepath.files.length) {
                for (var j = 0; j < includefilepath.files.length; j++) {
                    let filetemp = includepath + '\\' + includefilepath.files[j];
                    findAllFile(filetemp);
                }
            } else {
                findAllFile(includepath);
            }
        }
    } else {
        findAllFile(basePath);
    }
    if (baseConfig.excludeFiles && baseConfig.excludeFiles.length) {
        for (var i = 0; i < baseConfig.excludeFiles.length; i++) {
            let excludefilepath = baseConfig.excludeFiles[i];

            let excludepath = excludefilepath.path ? (basePath + '\\' + excludefilepath.path) : basePath;

            excludepath = excludepath.replace(/\//g, '\\');

            if (excludefilepath.files && excludefilepath.files.length) {
                for (var j = 0; j < excludefilepath.files.length; j++) {
                    let filetemp = excludepath + '\\' + excludefilepath.files[j];
                    removeInitIntellisenseFiles(filetemp);
                }
            } else {
                removeInitIntellisenseFiles(excludepath);
            }

        }
    }

    readAllFile(initIntellisenseFiles);
}
function removeInitIntellisenseFiles(str:string){
    initIntellisenseFiles = initIntellisenseFiles.filter(function(v){
        if(v.indexOf(str) == -1){
            return true;
        }
    });
}
function validateTextDocument(textDocument: TextDocument) {
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
        // var resultRefObj = getObjRef(textDoc, wordArr[0]);
        // keyWordsByObj = resultRefObj.concat(refObjArr);
        // console.log('当前输入对象的，关键字的索引数组：'+keyWordsByObj + '  length ' + keyWordsByObj.length);
    }

    setIntellisenseCompletionList();
}
function setIntellisenseCompletionList() {
    initCurConfigObj();
    var curObj = curConfigObj;
    for (var i = 0; i < keyWordsByObj.length - curFindObjFlag; i++) {
        var tempkey:string = keyWordsByObj[i];
        if (tempkey == 'window') {
            if (i !== 0) {
                initCurConfigObj();
                curObj = curConfigObj;
            }
            continue;
        }
        // for(let key  in curObj){
        //     if(key == tempkey){
        //         curObj = curObj
        //     }
        // }
        // if (!curObj[tempkey]) {
        //     return;
        // } else {
        //     curObj = curObj[tempkey];
        // }
    }
    // console.log(curObj);
    for (var key in curObj) {
        addcurIntellisenseList(key);
    }
}
// function getObjRef(str: string, name: string) {
//     if (name == 'window') {
//         return [];
//     }
//     var arr = [],
//         r = getObjstr(str, name);
//     if (r) {
//         curFindObjFlag = 1;
//         if (r.endsWith('.') && r) {
//             r = r.Substring(0, r.Length - 1);
//         }
//         var rArr = r.split('.');
//         for (var i = 1; i < rArr.length; i++) {
//             arr.push(rArr[i]);
//         }
//         if (rArr.length == 1) {
//             return rArr;
//         }
//         return [].concat(arguments.callee(str, rArr[0])).concat(arr);
//     } else {
//         return [name];
//     }

// }

function getObjstr(str: string, name: string) {
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

function findAllFile(dir: string) {
    dir = dir.replace(/\//g, '\\')
    if (isFile(dir)) {
        initIntellisenseFiles.push(dir);
        return;
    }

    var dirArr = readdirSync(dir),
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

function readAllFile(fileArray: Array<string>) {

    var _jsWords: Array<string> = ["require",
        "define",
        "break",
        "case",
        "catch",
        "continue",
        "default",
        "delete",
        "do",
        "else",
        "finally",
        "for",
        "function",
        "if",
        "in",
        "instanceof",
        'new',
        "return",
        "switch",
        "this",
        "throw",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with"
    ];

    var keyWords: Array<string> = [];

    for (let file of fileArray) {
        var fileDataString = readFile(file),
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
        if (_jsWords.indexOf(key) == -1 && !(/^[0-9]/.test(key))) {
            _jsWords.push(key);
            addIntellisenseItem(key);
        }
    }

    // console.log( '智能提示解析的关键字的长度：'+initIntellisenseList.length);
}
//检测智能提示的配置文件，只能是根目录存在的,返回基础配置的对象
function initIntellisenseConfig() {

    var configJs = workspacePath + "\\intellisenseConfig.json";
    console.log(configJs);
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

function addIntellisenseItem(text: string) {
    initIntellisenseIndex++;
    var item = {
        label: text,
        kind: CompletionItemKind.Text,
        data: initIntellisenseIndex
    };
    initIntellisenseList.push(item);
}

function addcurIntellisenseList(text: string) {
    curIntellisenseIndex++;
    var item = {
        label: text,
        kind: CompletionItemKind.Text,
        data: curIntellisenseIndex
    };
    curIntellisenseList.push(item);
}

function isDirectory(fileName: string) {
    if (existsSync(fileName)) return statSync(fileName).isDirectory();
    return false;
}

function isFile(fileName: string) {
    if (existsSync(fileName)) return statSync(fileName).isFile();
    return false;
}

function readFile(fileName: string) {
    if (existsSync(fileName)) { return readFileSync(fileName, "utf-8"); }
    return '';
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    validateTextDocument(change.document);
});

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
    // let settings = <Settings>change.settings;
    // maxNumberOfProblems = settings.lspSample.maxNumberOfProblems || 100;
    // // Revalidate any open text documents
    // documents.all().forEach(validateTextDocument);
});

connection.onDidChangeWatchedFiles((_change) => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
        {
            label: 'TypeScript',
            kind: CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'JavaScript',
            kind: CompletionItemKind.Text,
            data: 2
        }
    ]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    if (item.data === 1) {
        item.detail = 'TypeScript details',
            item.documentation = 'TypeScript documentation'
    } else if (item.data === 2) {
        item.detail = 'JavaScript details',
            item.documentation = 'JavaScript documentation'
    }
    return item;
});

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();
