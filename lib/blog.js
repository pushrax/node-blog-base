/*!
 * blog.js
 * Copyright(c) 2012 Justin Li <j-li.net>
 * MIT Licensed
 * For frustra.org 2.0
 */

var fs = require('fs'),
	path = require('path'),
	marked = require('marked'),
	yaml = require('yaml'),
	Inotify = require('inotify').Inotify;

function Blog(dir) {
	var self = this;

	this.posts = {};
	this.dir = path.resolve(__dirname, dir);

	this.reloadPosts();

	this.inotify = new Inotify(false);
	this.inotify.addWatch({
		path: self.dir,
		watch_for: Inotify.IN_MODIFY | Inotify.IN_DELETE | Inotify.IN_MOVE,
		callback: function(event) { self.reloadPosts() }
	});
}

Blog.prototype.getPosts = function() {
	return this.posts;
};

Blog.prototype.getPostByPath = function(httpPath) {
	var name = httpPath.substr(1).replace(/\//g, '-');
	return this.posts[name];
};

Blog.prototype.getPostsByTag = function(tag) {
	var taggedPosts = [];
	for (var name in this.posts) {
		var post = this.posts[name];
		for (var j = 0; j < post.tags.length; ++j) {
			if (post.tags[j] == tag) {
				taggedPosts.push(post);
				break;
			}
		}
	}
	return taggedPosts;
};

Blog.prototype.reloadPosts = function() {
	var self = this;
	self.posts = {};
	var files = fs.readdirSync(this.dir);

	files.forEach(function (file) {
		if (file.substr(file.length - 3) != '.md') return;
		fs.readFile(path.join(self.dir, file), 'utf-8', function(err, str) {
			var data = {str: str};
			var date = new Date(parseInt(file.substr(0, 4)), parseInt(file.substr(5, 2)), parseInt(file.substr(8, 2)));
			var name = file.substr(0, file.length - 3);

			self.parseMetadata(data);

			var html = marked(data.str);
			var tags = data.meta.tags || [];
			var synopsis = data.meta.synopsis || '';

			self.posts[name] = { name: name, title: data.meta.title, tags: tags, date: date, synopsis: synopsis, html: html };
		});
	});
};

Blog.prototype.parseMetadata = function(data) {
	var lines = data.str.split('\n');
	if (lines[0] == '---') {
		lines.shift();

		var metadata = "---\n";

		while (lines.length) {
			if (lines[0] == '---') {
				lines.shift();
				break;
			}
			metadata += '  ' + lines[0] + '\n';
			lines.shift();
		}

		data.str = lines.join('\n');
		data.meta = yaml.eval(metadata);
	}
};


module.exports = Blog;
