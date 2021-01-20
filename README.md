# This is the source code for the old Liefery IT blog

The live site can be found at [liefery-it-legacy.github.io/blog/](https://liefery-it-legacy.github.io/blog/)

It uses [Jekyll](http://jekyllrb.com) as a static site generator.

For editing convenience it has [livereload](http://livereload.com/) enabled
using the [guard-livereload](https://github.com/guard/guard-livereload) gem, which can be started together with the jekyll server using [invoker](http://invoker.codemancers.com/).

To start the whole shebang up, run:

```
bundle install
invoker start
```

and then visit localhost:4000/blog/ to see the blog in action.

# Deployment:
Is handled by github and done automatically.

# License and copyright
Following files, directories and their contents are copyright LieferFactory GmbH.
You may not reuse anything therein without permission:

* _posts/
* images
* index.html

All other files and directories are licensed under the
[MIT](http://opensource.org/licenses/MIT) unless explicitly stated.
