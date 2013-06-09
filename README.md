node-blog-base
==============

  A dead simple blogging backend that lets you drop in a Markdown formatted blog
to any existing Node.js site. It handles parsing and processing posts, but makes
you set up your own site (routes and templates).

  There are tons of sweet static content generators out there that are perfect
for many sites built from the ground up as blogs, but they do so much for you
that it's more difficult to integrate them with existing sites.


Posts
-----

Posts are stored in a single folder, with the name format `YYYY-MM-DD-title.md`.
The title in the file name is the one you'd use in a URL, and should be free of
weird characters.

Metadata is stored at the beginning of post files in YAML, delimited by `---`.
The remainder of the post is standard Markdown.

Example: `2010-01-23-nodejs-is-web-scale.md`

```markdown
---
title: Node.js is ★Web Scale★
tags:
- Javascript
- Node.js
- Web Scale
---

Just like [MongoDB](http://www.mongodb.org/), Node.js is web scale. That means
it's high-performance.

Why?
----

Blocking IO wasn't built for web scale. **Node.js handles web scale.** You turn it
on and it scales right up.

```

Usage
-----

First:

    npm install blog-base

Next, create a `Blog` and point it to your post folder:

```javascript
var Blog = require('blog-base')
var blog = new Blog(__dirname + '/blog-posts')
```

Then, define some routes for your blog, however you like. `Blog` provides these
methods:

### `blog.posts([offset], [count])`

Returns `count` posts starting at `offset` in reverse chronological order. If `offset`
and `count` are not specified, returns all posts in reverse chronological order.

### `blog.postsForTag(tag, [offset], [count])`

Same as `blog.posts`, but returns posts that include the tag `tag`.

### `blog.post(year, month, day, name)`

Returns the post published on `year`/`month`/`day` having name `name`.

### `blog.postCount()`

Returns the total number of posts.

### `blog.postCountForTag(tag)`

Returns the total number of posts that include the tag `tag`.

### `blog.reloadPosts()`

Rebuild the cache of posts from the filesystem. Done automatically on file
modification if [inotify](https://github.com/c4milo/node-inotify) is installed.

