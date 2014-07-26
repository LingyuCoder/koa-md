var fs = require('fs');
var hljs = require("highlight.js");
var jsdom = require('jsdom').jsdom;
var markdown = require("markdown").markdown;
var entities = require("entities");
var PATH = require('path');

var r_md_post = /(\.md)|(\.markdown)|(\.mdown)$/;

var slice = Array.prototype.slice;
var isArray = Array.isArray;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var assetPath = PATH.join(fs.realpathSync('.'), "node_modules/koa-md/assets");

var defaultConfig = {
	highlight: true,
	highlightStyle: "github",
	path: [],
	index: PATH.join(assetPath, "md/index.md"),
	error: PATH.join(assetPath, "md/error.md"),
	customCSS: false,
	contentOnly: true
};

var slice = Array.prototype.slice;
var hasOwnProperty = Object.prototype.hasOwnProperty;

hljs.configure({
	tabReplace: '    '
});

module.exports = function(opts) {
	var config = mix({}, defaultConfig, opts);
	return function * (next) {
		var res = this;
		var file = decodeURI(res.path);
		var raw = res.query.raw;
		var hasFile = true;
		var contentOnly = config.contentOnly;
		var ret;
		if (r_md_post.test(file)) {
			if (file === "/index.md") {
				file = config.index;
			}
			if (!fs.existsSync(file)) {
				file = config.error;
			}
			ret = yield readFile(file);
			res.body = res.body || "";
			if (!raw) {
				if (!contentOnly) {
					res.body += yield createHeader(file, config.customCSS);
					res.body += addIndexPanel(config.path);
				}
				ret = markdown.toHTML(ret.toString());
				if (config.highlight) {
					res.body += '<style type="text/css">';
					res.body += yield readFile(PATH.join(assetPath, 'css/' + config.highlightStyle + '.css'));
					res.body += '</style>';
				}
				res.body += '<article class="typo">' + (config.highlight ? highlight(ret) : ret) + '</article>';
				res.body += '<a id="raw" href="' + file + '?raw=true">查看源码</a>';
				if (!contentOnly) {
					res.body += createFooter();
				}
			} else {
				res.body += ret;
			}
			res.set('Last-Modified', (new Date).toUTCString());
			res.set('Cache-Control', 'max-age=0');
			res.set('Content-Type', 'text/' + (raw ? 'plain' : 'html') + ' ; charset=utf-8');

		}
		yield next;
	};
};

function createHeader(name, customCSS) {
	return function * (done) {
		var tpl = '<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <title>' + name + '</title>';
		if (customCSS && isArray(customCSS)) {
			customCSS.forEach(function(css) {
				tpl += '<link rel="stylesheet" href="' + css + '" />';
			});
			tpl += '</head><body>';
			return tpl;
		} else {
			tpl += '<style type="text/css">';
			tpl += yield readFile(PATH.join(assetPath, "css/typo.css"));
			tpl += '</style>';
			tpl += '<style type="text/css">';
			tpl += yield readFile(PATH.join(assetPath, "css/style.css"));
			tpl += '</style></head><body>';
			return tpl;
		}
	};
}

function createFooter() {
	return '</body></html>';
}

function addIndexPanel(path) {
	var result = "";
	path = toArray(path);
	result += '<div id="panel">';
	path.forEach(function(p) {
		var dir = p.dir || "";
		var label = p.label || p.dir;
		var fileList = walk(dir, "");
		if (fs.existsSync(PATH.join(dir, "index.md"))) {
			result += '<p><a href="' + PATH.join(dir, "index.md") + '">' + label + '</a></p>';
		} else {
			result += '<p>' + label + '</p>';
		}

		result += '<ul>';
		fileList.forEach(function(file) {
			if (file !== "index.md") {
				result += '<li><a href="' + PATH.join(dir, file) + '">' + file + '</a></li>';
			}
		});
		result += '</ul>';
	});
	result += '</div>'
	return result;
}

function readFile(path) {
	return function(done) {
		fs.readFile(path, function(err, content) {
			if (err) {
				done(err);
			} else {
				done(null, content.toString());
			}
		});
	}
}

function highlight(content) {
	var doc = jsdom(content);
	Array.prototype.slice.apply(doc.getElementsByTagName('code')).forEach(function(code) {
		code.innerHTML = hljs.fixMarkup(hljs.highlightAuto(entities.decodeHTML(code.innerHTML)).value);
	});
	return doc.innerHTML;
}



function walk(path, base) {
	var fullpath = PATH.join(path, base);
	var files = fs.readdirSync(fullpath);
	var list = [];
	files.forEach(function(item) {
		if (fs.statSync(PATH.join(fullpath, item)).isFile() && r_md_post.test(item)) {
			list.push(PATH.join(base, item));
		}
	});

	files.forEach(function(item) {
		if (fs.statSync(PATH.join(fullpath, item)).isDirectory()) {
			var tmp = walk(path, PATH.join(base, item));
			list = list.concat(tmp);
		}
	});
	return list;
}

function mix(dest) {
	var srcs = slice.call(arguments, 1);
	srcs.forEach(function(src) {
		for (var item in src) {
			if (hasOwnProperty.call(src, item)) {
				dest[item] = src[item];
			}
		}
	});
	return dest;
}

function toArray(obj) {
	if (Array.isArray(obj)) {
		return obj;
	} else {
		return [obj];
	}
}