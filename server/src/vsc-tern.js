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
const fs = require("fs");
const path = require("path");
const minimatch = require("minimatch");
const glob = require("glob");
const tern = require("tern");
const cfgFileName = ".tern-project";
const defaultCfg = {
    ecmaVersion: 6,
    libs: [],
    loadEagerly: [],
    dontLoad: [],
    plugins: {
        doc_comment: {
            fullDocs: true,
            strong: true
        }
    }
};
class Ternjs {
    constructor(projDir) {
		this.projDir = projDir;
        this.cfg = Object.assign({}, defaultCfg, {
            projectDir: projDir,
            async: true
        });
		this.initialize();
    }
    projRelativeFile(file) {
		//tern.js中用的路径是 c:/web/file的格式
        const abs = path.resolve(this.projDir, file);
		file = path.relative(this.projDir, abs);
		file = file.replace(/\\/g, "/");
        return file;
    }
    request(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.srv.request(doc, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    definition(file, end) {
        return __awaiter(this, void 0, void 0, function* () {
            file = this.projRelativeFile(file);
            return yield this.request({
                query: {
                    type: "definition",
                    lineCharPositions: true,
                    file,
                    end
                }
            });
        });
    }
    properties(file, end){
        return __awaiter(this, void 0, void 0, function* () {
            file = this.projRelativeFile(file);
            return yield this.request({
                query: {
					type: "properties",
                    lineCharPositions:true,
                    prefix:'ccj',
                    file,
                    end

                }
            });
        });
    }
	completions(file, end){

		return __awaiter(this, void 0, void 0, function* () {
            file = this.projRelativeFile(file);
            return yield this.request({
                query: {
					type: "completions",
					lineCharPositions:true,
                    file,
                    end
                }
            });
        });
    }
	updateFull(file,text){
		return __awaiter(this, void 0, void 0, function* () {
            file = this.projRelativeFile(file);
            return yield this.request({
				files:[{
					type:"full",
					name:file,
					text:text
				}]
            });
        });
	}
    type(file, end) {
        return __awaiter(this, void 0, void 0, function* () {
            file = this.projRelativeFile(file);
            return yield this.request({
                query: {
                    type: "type",
                    lineCharPositions: true,
                    preferFunction: true,
                    file,
                    end
                }
            });
        });
    }
    doc(file, end) {
        return __awaiter(this, void 0, void 0, function* () {
            file = this.projRelativeFile(file);
            return yield this.request({
                query: {
                    type: "documentation",
                    file,
                    end
                }
            });
        });
	}

    absPath(p) {
        return path.resolve(this.projDir, p);
	}

    mergeProjCfg() {
        const cfgFile = path.join(this.projDir, cfgFileName);
		try {
            const cfg = JSON.parse(fs.readFileSync(cfgFile,"utf8"));

			this.cfg = Object.assign(this.cfg, cfg);
		}
		catch (e) {
            console.log(e);
         }

    }
    // temporarily only supports plugins which are ternjs self-contained
    loadPlugins() {
        const plugins = this.cfg.plugins;
        return Object.keys(plugins).reduce((opts, name) => {
            const found = require.resolve(`tern/plugin/${name}.js`);
			const mod = require(found);
            if (mod.hasOwnProperty("initialize"))
                mod.initialize(this.projDir);
			opts[name] = plugins[name];
            return opts;
        }, {});
    }
    initialize() {
        this.mergeProjCfg();
		let plugins = this.loadPlugins();
        Object.assign(this.cfg, {
            getFile: (name, c) => {
                const dontLoad = this.cfg.dontLoad &&
                    this.cfg.dontLoad.some((pattern) => {
                        return minimatch(name, pattern);
                    });
                if (dontLoad) {
                    c(null, "");
                }
                else {
                    fs.readFile(path.resolve(this.projDir, name), "utf8", c);
                }
            },
            normalizeFilename: (name) => {
                const p = path.resolve(this.projDir, name);
                return path.relative(this.projDir, p);
            }
		});
        this.srv = new tern.Server(this.cfg);
        if (this.cfg.loadEagerly)
            this.cfg.loadEagerly.forEach((pat) => {
                glob.sync(pat, { cwd: this.projDir }).forEach(file => {
                    this.srv.addFile(file);
                });
            });
    }
}
exports.Ternjs = Ternjs;
