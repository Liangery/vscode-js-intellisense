"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const ternjs_1 = require("./vsc-tern");
const path = require('path');
const completionsApi1 = require('./completions');
const connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
const documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
let workspaceRoot = null;
let ternSrv = null;
let textDoc = null;


connection.onInitialize(params => {
    workspaceRoot = params.rootPath;
    if (workspaceRoot !== null)
        ternSrv = new ternjs_1.Ternjs(workspaceRoot);
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: [".", ":", "<", '"', "/", "@", "*"]
            },
            definitionProvider: false,
            hoverProvider: false
        }
    };
});
//文件内容改动 , 更新tern的引擎中的ast内容
documents.onDidChangeContent(change => {
    if (ternSrv === null)
        return;
    textDoc = change.document.getText();
    let file = vscode_uri_1.default.parse(change.document.uri).path;
        file = vscode_uri_1.default.file(file).fsPath;
    ternSrv.updateFull(file,textDoc);

});
//智能感知部分开始
connection.onCompletion((params) => __awaiter(this, void 0, void 0, function* () {
    if (ternSrv === null)
        return;
    let file = vscode_uri_1.default.parse(params.textDocument.uri).path;
        file = vscode_uri_1.default.file(file).fsPath;
    const loc = { line: params.position.line, ch: params.position.character};
    const completions = yield ternSrv.completions(file,loc);
    if(completions.completions && completions.completions.length){
        return completionsApi1.completionsApi.getVscodeCompletions(ternSrv.srv,completions.completions);
    }
    else{
        let lines = textDoc.split(/\r?\n/g);
        let curline = lines[loc.line];
        let words = curline.split('.');
        let word = '';
        for(var i=words.length-1;i>-1;i--){
            if(words[i].trim()){
                word = words[i];
                break;
            }
        }
        if(word == 'window'){
            return ;
        }
        return completionsApi1.completionsApi.getVscodeCompletionsMaybe(ternSrv.srv,word);
    }
}));

connection.onDefinition((params) => __awaiter(this, void 0, void 0, function* () {
    if (ternSrv === null)
        return;
    const file = vscode_uri_1.default.parse(params.textDocument.uri).path;
    const loc = { line: params.position.line, ch: params.position.character };
    const def = yield ternSrv.definition(file, loc);
    if (def.file && def.start && def.end) {
        const uri = vscode_uri_1.default.file(ternSrv.absPath(def.file));
        return {
            uri: uri.toString(),
            range: {
                start: { line: def.start.line, character: def.start.ch },
                end: { line: def.end.line, character: def.end.ch }
            }
        };
    }
    return [];
}));

connection.listen();
//# sourceMappingURL=server.js.map