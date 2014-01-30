/*!
 * blog.js
 * Copyright(c) 2013 Justin Li <j-li.net>
 * MIT Licensed
 * For frustra.org 2.0
 */

var fs = require('fs'),
    path = require('path'),
    marked = require('marked'),
    yaml = require('yaml'),
    moment = require('moment');

function Blog(dir, options) {
  var self = this;

  this.options = options || { flat: false, watch: true };
  this.postCache = [];
  this.postNames = {};
  this.postTags = {};

  this.dir = path.resolve(__dirname, dir);

  if (this.options.marked) {
    marked.setOptions(this.options.marked)
  }

  this.reloadPosts();

  if (this.options.watch) {
    fs.watch(this.dir, { persistent: false }, function() {
      self.reloadPosts()
    });
  }
}

Blog.handleize = function(str) {
  return str.toLowerCase().replace(/ /g, '-');
};

Blog.prototype.postCount = function() {
  return this.postCache.length;
};

Blog.prototype.postCountForTag = function(tag) {
  return this.postTags[tag].length;
};


Blog.prototype.posts = function(offset, count) {
  if (offset !== undefined) {
    if (count !== undefined) {
      return this.postCache.slice(offset, offset + count);
    } else {
      return this.postCache.slice(0, offset);
    }
  }
  return this.postCache;
};

Blog.prototype.postsForTag = function(tag, offset, count) {
  var taggedPosts = [];
  if (tag in this.postTags) {

    offset = offset || 0;
    count = count || this.postTags[tag].length - offset;

    for (var i = offset, l = offset + count; i < l; ++i) {
      if (i >= this.postTags[tag].length) break;
      taggedPosts.push(this.postCache[this.postTags[tag][i]]);
    }
  }
  return taggedPosts;
};

Blog.prototype.post = function(name, year, month, day) {
  if (this.options.flat) {
    return this.postCache[this.postNames[name]];
  } else {
    if (typeof year === 'string') year = parseInt(year, 10);
    if (typeof month === 'string') month = parseInt(month, 10);
    if (typeof day === 'string') day = parseInt(day, 10);

    if (year in this.postNames && (month - 1) in this.postNames[year] && day in this.postNames[year][month - 1])
      return this.postCache[this.postNames[year][month - 1][day][name]];
  }
};

Blog.prototype.reloadPosts = function() {
  var self = this;
  self.tempPosts = [];
  var files = fs.readdirSync(this.dir);
  var filesLeft = files.length;

  files.forEach(function (file) {
    var dotPosition = file.lastIndexOf('.');
    var fileExtension = file.substr(dotPosition + 1);

    function cb() {
      --filesLeft;
      if (filesLeft == 0) self.afterPostsReloaded();
    }

    if (dotPosition == -1 || !(fileExtension == 'md' || fileExtension == 'markdown')) return cb();

    var fileName = file.substr(0, dotPosition);
    var dateInName = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-/.test(fileName)

    if (!self.options.flat && !dateInName) return cb();

    fs.readFile(path.join(self.dir, file), 'utf-8', function(err, str) {
      var data = { str: str.replace(/\r/g, '') };
      var date;

      self.parseMetadata(data);

      if (dateInName) {
        date = new Date(parseInt(fileName.substr(0, 4), 10), parseInt(file.substr(5, 2), 10) - 1, parseInt(file.substr(8, 2), 10));
      } else if (self.options.flat && data.meta.date) {
        date = moment(data.meta.date).toDate();
      } else {
        return cb();
      }

      data.meta.date = date;

      var html = marked(data.str);
      var tags = data.meta.tags || [];

      self.tempPosts.push({ name: fileName.substr(11), title: data.meta.title, tags: tags, date: date, html: html, meta: data.meta });
      cb();
    });
  });
};

Blog.prototype.afterPostsReloaded = function() {
  var self = this;
  self.tempPosts.sort(function (a, b) {
    return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
  });

  self.postNames = {};
  self.postTags = {};

  for (var postIndex = 0, l = self.tempPosts.length; postIndex < l; ++postIndex) {
    var date = self.tempPosts[postIndex].date;
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();

    var postNamesForPost;
    if (self.options.flat) {
      postNamesForPost = self.postNames;
    } else {
      if (!(year in self.postNames)) self.postNames[year] = {};
      if (!(month in self.postNames[year])) self.postNames[year][month] = {};
      if (!(day in self.postNames[year][month])) self.postNames[year][month][day] = {};
      postNamesForPost = self.postNames[year][month][day];
    }

    postNamesForPost[self.tempPosts[postIndex].name] = postIndex;

    for (var j = 0; j < self.tempPosts[postIndex].tags.length; ++j) {
      var tag = Blog.handleize(self.tempPosts[postIndex].tags[j]);
      if (!(tag in self.postTags)) {
        self.postTags[tag] = [];
      }
      self.postTags[tag].push(postIndex);
    }
  }

  self.postCache.length = 0;
  self.postCache = self.tempPosts;
  self.tempPosts = [];
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
  } else {
    data.meta = { title: "!!! missing metadata !!!" };
  }
};


module.exports = Blog;
