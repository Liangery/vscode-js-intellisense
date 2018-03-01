const { workspace, ExtensionContext } = require("vscode");

const {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} = require("vscode-languageclient");
const path = require("path");

function activate(context) {
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server-tern.js'));
    // 服务的调试选项
    let debugOptions = { execArgv: ["--nolazy", "--inspect=7009"] };
    let serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };
    let clientOptions = {
        documentSelector: [{ scheme: "file", language: "javascript" }]
    };
    // 创建一个语言客户端并启动这个客户端。
    let disposable = new LanguageClient(
        "js",
        "js-intellisense",
        serverOptions,
        clientOptions
    ).start();
    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
