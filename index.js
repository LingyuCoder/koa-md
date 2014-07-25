var env = require('jsdom').env;
var fs = require('fs');
var hljs = require("highlight.js");
var jsdom = require('jsdom').jsdom;
var markdown = require("markdown").markdown;
var entities = require("entities");
var PATH = require('path');

var r_md_post = /(.md)|(.markdown)|(.mdown)$/;
var r_deal = /(.+)\.(.+)/;

hljs.configure({
	tabReplace: '    '
})

module.exports = function(opts) {
	var path = opts.path;
	var indexFile = opts.index;
	var style = opts.style || 'github';
	var preTpl = '<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>Document</title> <link rel="stylesheet" href="/css/' + style + '.css" /><link rel="stylesheet" href="/css/typo.css" /><link rel="stylesheet" href="/css/style.css" /></head> <body>';
	var postTpl = '</body> </html>';
	return function * (next) {
		var res = this;
		var file = res.path;
		var raw = res.query.raw;
		var hasFile = true;
		var ret;
		if (path && (!r_deal.test(file) || r_md_post.test(file))) {
			res.body = preTpl;;
			addIndexPanel(res, path);

			if (!r_md_post.test(file) && !(file = getIndexFile(file, indexFile))) {
				this.body += '<article class="typo"><div>文件未找到</div></article>';
			} else {
				ret = yield readFile(file);
				if (!raw) {
					ret = markdown.toHTML(ret.toString());
					this.body += '<article class="typo">' + highlight(ret) + '</article>';
					this.body += '<a id="raw" href="' + file + '?raw=true">查看源码</a>';
				} else {
					this.body = ret;
				}

			}
			res.body += postTpl;
			res.set('Last-Modified', (new Date).toUTCString());
			res.set('Cache-Control', 'max-age=0');
			res.set('Content-Type', 'text/' + (raw ? 'plain':'html') + ' ; charset=utf-8');
		}
		yield next;
	};
};

function getIndexFile(category, indexFile) {
	if (category === '/' && !indexFile) {
		return "node_modules/koa-md/readme.md";
	} else {
		return indexFile;
	}
	var postTest = ['markdown', 'mdown', 'md'];
	var i;
	for (i = postTest.length; i--;) {
		var path = PATH.join(category, "/index." + postTest[i]);
		if (fs.existsSync(path)) {
			return path;
		}
	}
	return;
}

function addIndexPanel(res, path) {
	path = toArray(path);
	res.body += '<div id="panel">';
	path.forEach(function(p) {
		var dir = p.dir || "";
		var label = p.label || p.dir;
		var fileList = walk(dir, "");
		res.body += '<p><a href="' + dir + '">' + label + '</a></p>';
		res.body += '<ul>';
		fileList.forEach(function(file) {
			res.body += '<li><a href="' + PATH.join(dir, file) + '">' + file + '</a></li>';
		});
		res.body += '</ul>';
	});
	res.body += '</div>'
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

function toArray(obj) {
	if (Array.isArray(obj)) {
		return obj;
	} else {
		return [obj];
	}
}