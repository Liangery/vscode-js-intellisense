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
    connection.console.log(
        `[Server(${process.pid}) Document opened: ${event.document.uri}`
    );
});
documents.listen(connection);

//文件内容改动 , 可做代码检测
documents.onDidChangeContent(change => {
    // console.log(change);
});
var workspacePath = "",
    initIntellisenseFiles = [],
    initIntellisenseList = [];

function initIntellisenseCompletionList(){
    findAllFile(workspacePath);
    readAllFile(initIntellisenseFiles);
}
function findAllFile(dir) {
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
function readAllFile(files){
    for(var i=0;i<files.length;i++){
        var file = files[i],
            fileDataString = readFile(file),
            lines = fileDataString.split(/?\r?\n/g);
        for(var j=0;j<lines.length;j++){
            var line = lines[j],
                words = line.split('.');
            for(var k=0;k<words.length;k++){
                addIntellisenseItem(words[k]);
            }
        }
    }
}
function addIntellisenseItem(text){
    var len = initIntellisenseList.length,
        item = {
            label: text,
            kind: CompletionItemKind.Text,
            data: len
        };
    for(var i=0;i<initIntellisenseList.length;i++){
        if(initIntellisenseList[i].label == text){
           continue; 
        }else{
            initIntellisenseList.push(item);
        }
    }
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
    connection.console.log(
        `[Server(${process.pid}) Started and initialize received,path  ${workspacePath}`
    );
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
    console.log(definitionParams, "definitionParams");
});
//文档引用
connection.onReferences(referenceParams => {
    const document = documents.get(referenceParams.textDocument.uri);
    console.log(referenceParams, "referenceParams");
});

//文档格式化
connection.onDocumentFormatting(formatParams => {
    const document = documents.get(formatParams.textDocument.uri);
    console.log(formatParams, "formatParams");
});

connection.onDocumentHighlight(documentHighlightParams => {
    const document = documents.get(documentHighlightParams.textDocument.uri);
    console.log('onDocumentHighlight');
});

//智能感知部分开始
connection.onCompletion(TextDocumentPositionParams => {
    console.log(TextDocumentPositionParams, "TextDocumentPositionParams");
    return [
        {
            label: "TypeScript",
            kind: CompletionItemKind.Text,
            data: 1
        },
        {
            label: "JavaScript",
            kind: CompletionItemKind.Text,
            data: 2
        }
    ];
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
