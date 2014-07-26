koa-md
======

koa-md是一个koa中间件，可用于将markdown文件转换为HTML，并提供代码高亮功能

##EXAMPLE
###Hello
使用`npm install koa`安装koa，`npm install koa-md`安装koa-md，新建一个文件app.js，内容如下：

	var koa = require('koa');
	var md = require('koa-md');
	var app = koa();

	app.use(md({
		//koa-md配置信息
	}));

	app.listen(4000);

`node --harmony app.js`启动服务器后查看`localhost:4000/index.md`。koa-md会对所有`.md`、`.markdown`、`.mdown`的进行处理，若请求带参数`?raw=true`则会返回markdown文件源代码

###Markdown站点
koa-md能够通过修改配置，快速构建Markdown查看站点：

如有两个含有markdown文件的文件夹，路径分比为`/dir1`和`/dir2`，则将app.js修改如下：

	var koa = require('koa');
	var md = require('koa-md');
	var app = koa();

	app.use(md({
	  path: [{
	  	label: "第一个文件夹",
	  	dir: "/dir1"
	  }, {
	  	label: "第二个文件夹",
	  	dir: "/dir2"
	  }],
	  contentOnly: false
	}));

	app.listen(4000);

即可搭建一个浏览markdown文件的站点，鼠标悬停左上角能看到目录下含有的所有markdown文件，并提供链接。若文件夹中存在`index.md`，将作为目录的链接


##OPTIONS
###contentOnly
Boolean类型，是否只传输markdown内容，若为false，则构建markdown站点

###path
Array类型，构建markdown站点时包含markdown文件的文件夹列表，每项包含两个属性：
1. label：字符串，构建站点时右上角显示的文件夹标识
2. dir：字符串，文件夹的绝对路径

###highlight
Boolean类型，是否开启代码高亮

###highlightStyle
String类型，若开启代码高亮，代码高亮的样式，目前可以取值为highlight.js的所有高亮样式，详细见[highlight.js官方文档](https://github.com/isagalaev/highlight.js/tree/master/src/styles)

默认为`github`，样式会使用`<style>`标签写入到页面中

###customCSS
Array类型，仅在开启markdown站点时有效，表示使用自定义样式，每一项为一个字符串，为样式文件的路径，会通过`<link>`标签添加到页面中。

若配置为`[]`，将不添加任何样式

若不进行配置，则会自动添加`node_modules/koa-md/assets/css/typo.css`和`node_modules/assets/css/style.css`，会通过`<style>`标签添加到页面中

###index
String类型，构建markdown站点时`/index.md`显示的内容，默认为`node_modules/koa-md/assets/md/index.md`

###error
String类型，构建markdown站点时，文件未找到时显示的内容，默认为`node_modules/koa-md/assets/md/error.md`

##LICENSE
MIT