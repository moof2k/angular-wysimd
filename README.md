# What you see is markdown

**WYSIMD** is an [Angular directive](https://docs.angularjs.org/guide/directive) that supplies a rich-text _WYSIWYG_
[contentEditable](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_Editable) backed by an
ngModel storing [Markdown](https://daringfireball.net/projects/markdown/).

Best demonstrated with a [live demo](http://moof2k.github.io/wysimd/).

Some possible use cases for this code:

* You want to display rendered Markdown in an Angular application
* You want to allow users to edit Markdown in a WYSIWYG manner
* You want to allow users to simultaneously edit rich-text as either Markdown and WYSIWYG

## Installation

Quickly install w/ bower:

    bower install angular-wysimd

Otherwise download `wysimd.js`, `markdown.js`, angular > 1.2, rangy > 1.2.3 and include these scripts in your project.

## Configuration

See [index.html](index.html) for a complete example.

## Some technical details

WYSIMD is made up of three main components:

* An Angular directive that hooks into ngModel to detect updates to a contentEditable region and synchronize
with other elements that are tied to the same ngModel.
* A markdown -> html conversion routine, adapted from https://github.com/evilstreak/markdown-js
* A DOM -> markdown conversion routine

## License

BSD
