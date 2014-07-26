var env = require('jsdom').env;
var fs = require('fs');
var hljs = require("highlight.js");
var jsdom = require('jsdom').jsdom;
var markdown = require("markdown").markdown;
var entities = require("entities");
var PATH = require('path');

var r_md_post = /(.md)|(.markdown)|(.mdown)$/;
var r_deal = /(.+)\.(.+)/;

var slice = Array.prototype.slice;
var hasOwnProperty = Object.prototype.hasOwnProperty;

hljs.configure({
	tabReplace: '    '
})

var realPath = ffs.realpathSync('.');

var defaultConfig = {
	highlight: true,
	highlightStyle: "github"
	path: [],
	index: PATH.join(realPath, "README.md"),
	customCSS: [PATH.join(realPath, "assets/typo.css")],
	fullHTML: false
};


module.exports = function(opts) {
	var config = mix({}, defaultConfig, opts);
	return function * (next) {
		var res = this;
		var file = res.path;
		var raw = res.query.raw;
		var hasFile = true;
		var fullHTML = config.fullHTML;
		var preTpl = fullHTML ? createHeader() : "";
		var ret;
		if (r_md_post.test(file)) {
			ret = yield readFile(file);
			if (!raw) {
				if (fullHTML) {
					res.body += createHeader(file, config.customCSS);
					res.body += addIndexPanel(path);
				}
				ret = markdown.toHTML(ret.toString());
				res.body += '<article class="typo">' + highlight(ret) + '</article>';
				res.body += '<a id="raw" href="' + file + '?raw=true">查看源码</a>';
			} else {
				res.body = ret;
			}
			res.body += postTpl;
			res.set('Last-Modified', (new Date).toUTCString());
			res.set('Cache-Control', 'max-age=0');
			res.set('Content-Type', 'text/' + (raw ? 'plain' : 'html') + ' ; charset=utf-8');

		}
		yield next;
	};
};

function createHeader(file, cssFiles) {
	var tpl = '<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <title>' + file + '</title>';
	for (var css in cssFiles) {
		tpl += '<link rel="stylesheet" href="' + cssFile + '" />';
	}
	tpl += '</head><body>';
}

function createFooter() {
	return '</body></html>';
}

function addIndexPanel(res, path) {
	var result = "";
	path = toArray(path);
	result += '<div id="panel">';
	path.forEach(function(p) {
		var dir = p.dir || "";
		var label = p.label || p.dir;
		var fileList = walk(dir, "");
		result += '<p><a href="' + PATH.join(dir, "index.md") + '">' + label + '</a></p>';
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