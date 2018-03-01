const {
    CompletionItemKind
} = require("vscode-languageserver");

var CompletionType = {
	fun:"Function.prototype",
	obj:"Object.prototype",
	txt:""
}

function getCompletionItemKindType(type){
	let objtype = null;
	switch(type){
		case "Function.prototype":
			objtype = CompletionItemKind.Function;
			break;
		case "Object.prototype":
			objtype = CompletionItemKind.Property
			break;
		default:
			objtype = CompletionItemKind.Text;
			break;
	}
	return objtype;
}
function searchCompletionItemContextExportObj(srv,name,objkey){
	let props = Object.keys(srv.cx.props);
	let types = [];

	for(var prop of props){
		if(prop == '<i>'){
			continue;
		}
		let tempProp = srv.cx.props[prop];
		if(name == prop){
			let obj = srv.cx.props[prop];
			if(Array.isArray(obj)){
				for(var i=0;i<obj.length;i++){
					var temp = obj[i];
					if(!temp.name){
						continue;
					}
					if(obj[i] && obj[i].proto){
						types.push(obj[i].proto.name);
					}
					if(objkey && objkey == obj[i].name){
						types = [obj[i].proto.name];
						break;
					}
					if(temp.props[name] && temp.props[name].types){
						let t = temp.props[name].types;
						for(var j=0;j<t.length;j++){
							let tt = t[j];
							if(tt.proto.name){
								types.push(tt.proto.name);
							}
						}
					}
				}
			}
			break;
		}
	}
	types.sort();
	function strAtArrayCount(str) {
		return types.lastIndexOf(str) - types.indexOf(str) + 1;
	}
	if(types.length == 1 || types[0] == types[types.length - 1]){
		return types[0];
	}

	if(types.indexOf(CompletionType.fun) > -1){
		if(types.indexOf(CompletionType.obj) > -1){
			if(strAtArrayCount(types, CompletionType.fun) >= strAtArrayCount(types, CompletionType.obj)){
				return CompletionType.fun;
			}else{
				return CompletionType.obj;
			}
		}else{
			return CompletionType.fun;
		}
	}else if(types.indexOf(CompletionType.obj) > -1){
		let num = strAtArrayCount(CompletionType.obj);
		if(num > types.length/2){
			return CompletionType.obj;
		}else{
			return CompletionType.txt;
		}
	}else {
		return CompletionType.txt;
	}
	return CompletionType.txt;
}
function getVscodeCompletions(srv,completions){
	if(!srv || !completions || !completions.length){
		return [];
	}
	var vscodecompletions = [];
	for(var i=0;i<completions.length;i++){
		let kindtype = searchCompletionItemContextExportObj(srv,completions[i]);
		vscodecompletions.push({
			label:completions[i],
			kind:getCompletionItemKindType(kindtype),
			data:i
		});
	}
	return vscodecompletions;
}
function searchSrvPropty(srv,name){
	let props = Object.keys(srv.cx.props);
	let result = [];
	for(var prop of props){
		if(prop == '<i>'){
			continue;
		}
		let tempProp = srv.cx.props[prop];
		for(var i=0;i<tempProp.length;i++){
			let temp = tempProp[i];
			if(temp.name && (temp.name.indexOf(name) + name.length) == temp.name.length){
				let tempprops = temp.props;
				result = result.concat(Object.keys(tempprops));
			}
		}
	}
	let r = Array.from(new Set(result));
	return r;
}
function getVscodeCompletionsMaybe(srv,word){
	if(!srv || !word){
		return;
	}
	let completions = searchSrvPropty(srv,word);
	console.log(completions);
	return getVscodeCompletions(srv,completions);

}
exports.completionsApi = {
	getVscodeCompletions,
	getVscodeCompletionsMaybe
}