/**
 * What you see is markdown
 *
 * Copyright (c) 2015 Robert W. Rose (moof2k)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var fixhtml = function(node) {

    // Can't seem to efficiently detect the creation of span's.. so just always
    // be looking for them and eliminating them. This is probably slow.
    $(node).find('span').each(function(i) {
        $(this).replaceWith(this.innerHTML);
    });
};

var FILTER_NONE = 0x00;
var FILTER_INLINE_FORMATTING = 0x01;
var FILTER_BLOCK_FORMATTING = 0x02;
var FILTER_LIST_FORMATTING = 0x04;

var iterateChildren = function(node, filter) {
    var md = "";
    var child = node.firstChild;
    while(child) {
        md += dom2markdown(child, filter);
        child = child.nextSibling;
    }
    return md;
};

var dom2markdown = function(node, filter) {

    var md = "";

    if(node.nodeType == 3) {
        if(node.data == ' ') {
            md += ' ';
        }
        else if(node.data.trim() !== '') {
            md += node.data.replace(/\n/g, ' ');

            // Escape inline formatting characters
            md = md.replace(/\*/g, '\\*');
            md = md.replace(/_/g, '\\_');
            md = md.replace(/`/g, '\\`');
        }
    } else {
        switch(node.nodeName) {
        	case "WYSIMD":
            case "DIV":
            case "P":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + "\n";
                } else {
                    md += "\n";
                    md += iterateChildren(node, filter);
                    md += "\n";
                }
                break;
            case "BR":
                md += "  \n";
                break;
            case "A":
                var content = iterateChildren(node, filter);
                var link = node.attributes.href.value;

                if(content == link) {
                    md += "<" + link + ">";
                } else {
                    if(node.attributes.title) {
                        link += " \"" + node.attributes.title.value + "\"";
                    }

                    md += "[" + content + "]" + "(" + link + ")";
                }
                break;
            case "IMG":
                md += "![" + node.alt + "]" + "(" + node.src + ")";
                break;
            case "B":
            case "STRONG":
                md += "**" + iterateChildren(node, filter) + "**";
                break;
            case "I":
            case "EM":
                md += "_" + iterateChildren(node, filter) + "_";
                break;
            case "TT":
                md += "`" + iterateChildren(node, filter) + "`";
                break;
            case "H1":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";
                } else {
                    md += "\n# " + iterateChildren(node, filter) + "\n";
                }
                break;
            case "H2":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";
                } else {
                    md += "\n## " + iterateChildren(node, filter) + "\n";
                }
                break;
            case "H3":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";
                } else {
                    md += "\n### " + iterateChildren(node, filter) + "\n";
                }
                break;
            case "H4":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";
                } else {
                    md += "\n#### " + iterateChildren(node, filter) + "\n";
                }
                break;
            case "H5":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";
                } else {
                    md += "\n##### " + iterateChildren(node, filter) + "\n";
                }
                break;
            case "BLOCKQUOTE":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";
                } else {
                    md += iterateChildren(node, filter);

                    // Remove any straggling whitespace
                    md = md.replace(/\s+$/, '');
                    md = md.replace(/^\s+/, '');

                    // Prefix all contained text with >
                    md = md.split('\n');
                    md.unshift('');
                    md = md.join('\n> ') + "\n";
                }
                break;
            case "PRE":
                if(filter & FILTER_BLOCK_FORMATTING) {
                    md += " " + node.innerText.replace(/\n/g, ' ') + " ";
                } else {
                    md += node.innerText;

                    // Indent all contained text
                    md = "\n    " + md.split('\n').join('\n    ') + "\n";
                }
                break;
            case "UL":
            case "OL":
                if(filter & FILTER_LIST_FORMATTING) {
                    md += iterateChildren(node, filter) + " ";

                } else {
                    md += iterateChildren(node, filter);

                    // If we're the last of the list, add additional newline
                    if(node.parentNode.nodeName == "DIV" || node.parentNode.nodeName == "P") {
                        md += "\n\n";
                    } else {
                        // Indent all contained text
                        md = md.split('\n').join('\n    ');
                    }
                }

                break;
            case "LI":
                if(filter & FILTER_LIST_FORMATTING) {
                    md += " " + iterateChildren(node, filter);

                } else {
                    if(node.parentNode.nodeName == "OL") {
                        md += '\n1.  ';
                    } else {
                        md += '\n*   ';
                    }
                    md += iterateChildren(node, filter | FILTER_BLOCK_FORMATTING);
                }

                break;
            case "TABLE":
                md += "\n" + iterateChildren(node, filter | FILTER_LIST_FORMATTING | FILTER_BLOCK_FORMATTING) + "\n";
                break;
            case "THEAD":
                md += iterateChildren(node, filter);

                // Append a heading row following this row
                // Be mindful of |'s inside the column names
                md = md + md.replace(/([^\\|\n])/g, '-').replace(/\\\|/g, '--').replace(/\\/g, '-');

                break;
            case "TBODY":
                md += iterateChildren(node, filter);
                break;
            case "TR":
                md += "|" + iterateChildren(node, filter) + "\n";
                break;
            case "TH":
            case "TD":
                md += iterateChildren(node, filter);

                // Escape |
                md = md.replace(/\|/g, '\\|');
                md += " |";
                break;

        }
    }

    return md;
};

var block_container = function(node, name) {
    if(node.nodeName == name) {
        return node;
    } else {
        if(node.parentNode) {
            return block_container(node.parentNode, name);
        } else {
            return null;
        }
    }
};

var html_keydown = function(event) {
    var sel, range, container;

    if (event.keyCode == 32) {
        // Handle space key
        sel = rangy.getSelection();
        range = sel.getRangeAt(0);
        container = range.commonAncestorContainer;

        if(container.parentNode.nodeName == "P" || container.parentNode.nodeName == "DIV") {

            if(container.parentNode.innerText.match(/^\*\s*$/)) {
                // Create an unordered list when "* " is typed in an empty P/DIV

                if(range.startOffset == range.endOffset) {
                    if(range.startOffset == 1) {
                        document.execCommand("insertUnorderedList", false, null);

                        // Clear the content from the new LI
                        sel = rangy.getSelection();
                        range = sel.getRangeAt(0);
                        container = range.commonAncestorContainer;
                        container.data = "";

                        event.preventDefault();
                    }
                }

            } else if(container.parentNode.innerText.match(/^#+\s*$/)) {
                // Create a heading when "# " is typed in an empty P/DIV

                if(range.startOffset == range.endOffset) {
                    if(range.startOffset >= 1) {
                        // Determine the heading level by counting the number of #'s
                        var headingLevel = container.parentNode.innerText.match(/#/g).length;
                        if(headingLevel > 5) {
                            headingLevel = 5;
                        }

                        document.execCommand('formatBlock', false, "H" + headingLevel);

                        // Reset the content for the new heading
                        sel = rangy.getSelection();
                        range = sel.getRangeAt(0);
                        container = range.commonAncestorContainer;
                        container.data = "Heading " + headingLevel;

                        // Select all of the text so the user can keep typing
                        sel = rangy.getSelection();
                        range = sel.getRangeAt(0);
                        range.setEnd(container, container.data.length);
                        sel.setSingleRange(range);

                        event.preventDefault();
                    }
                }
            }
        }

    } else if (event.keyCode == 9) {
        // Handle tab key
        sel = rangy.getSelection();
        range = sel.getRangeAt(0);
        container = range.commonAncestorContainer;
        startContainer = range.StartContainer;

        container = block_container(container, "LI");

        if(container) {
            // We're in a list
            // Verify nothing is selected
            if(range.startOffset == range.endOffset) {
                // Insert a new sub-list at this point
                console.log('go');
                var ul = document.createElement("UL");

                if(container.previousSibling) {
                    container.previousSibling.appendChild(ul);
                    ul.appendChild(container);

                    range = document.createRange();
                    range.setStart(container, 0);
                    range.setEnd(container, 0);
                    sel.setSingleRange(range);
                }
            }

            // If you hit tab inside an LI always eat the tab
            event.preventDefault();
        }

    } else if (event.keyCode == 13) {
        // Handle return / newline key
        sel = rangy.getSelection();
        range = sel.getRangeAt(0);
        container = range.commonAncestorContainer;

        if(container.nodeName == "PRE" && range.endOffset == container.childNodes.length) {
            // We're at the very end of a PRE
            var p = document.createElement("P");
            var br = document.createElement("BR");
            p.appendChild(br);

            range.deleteContents();
            container.parentNode.insertBefore(p, container.nextSibling);
            range.setStartAfter(br);
            sel.setSingleRange(range);

            event.preventDefault();
        }

        switch(container.parentNode.nodeName) {

            case "PRE":
                if(container.nextSibling === null && range.endOffset == container.data.length) {
                    // We're at the end of the PRE, add a <br>
                    var brnode = document.createElement("BR");
                    range.deleteContents();
                    range.insertNode(brnode);
                    range.setStartAfter(brnode);
                    sel.setSingleRange(range);

                }

                // Anywhere else inside the PRE, add a \n
                var nlnode = document.createTextNode("\n");
                range.deleteContents();
                range.insertNode(nlnode);
                range.setStartAfter(nlnode);
                sel.setSingleRange(range);


                event.preventDefault();

                break;

            default:
                break;
        }

        return true;
    }
};

angular.module('moof2k.wysimd', []).
directive('wysimd', function() {
	return {
		restrict: 'E',
		require: 'ngModel',
		scope: {
			control: '='
		},
		link: link
	};

	function link(scope, element, attrs, ngModel) {
		if (!ngModel) return;
		
		scope.internalControl = scope.control || {};

		// Modify the formatBlock of the currently selected text
		scope.internalControl.format = function(name) {
            document.execCommand('formatBlock', false, name);
            scope.$evalAsync(html2markdown);
        };

        // Toggle bold on the currently selected text
		scope.internalControl.bold = function() {
            document.execCommand("bold", false, null);
            scope.$evalAsync(html2markdown);
        };

        // Toggle italic on the current selected text
        scope.internalControl.italic = function() {
            document.execCommand("italic", false, null);
            scope.$evalAsync(html2markdown);
        };

        // Toggle a UL on the currently selected text
        scope.internalControl.unordered_list = function() {
            document.execCommand("insertUnorderedList", false, null);
            scope.$evalAsync(html2markdown);
        };

        // Toogle an OL on the currently selected text
        scope.internalControl.ordered_list = function() {
            document.execCommand("insertOrderedList", false, null);
            scope.$evalAsync(html2markdown);
        };

		// Specify how UI should be updated
        ngModel.$render = function() {
            if (element[0].nodeName == "TEXTAREA") {
                element.html(ngModel.$viewValue || '');
            } else {
                markdown2html();
            }
        };

        // Listen for change events to update markdown model
        element.on('blur keyup change mouseup', function() {

            // Update toolbar
            if (document.queryCommandState) {
            	// TODO: Callback handler for bold/italic/formatblock etc
                //scope.toolbarModel.bold = document.queryCommandState("bold");
                //scope.toolbarModel.italic = document.queryCommandState("italic");
            }

            // TODO: Fix up HTML issues (requires jQuery, disabled for now)
            //fixhtml(element[0]);

            // Rebuild markdown
            scope.$evalAsync(html2markdown);
        });

        // Listen for keydown events to shortcut certain editor events
        element.on('keydown', function(event) {
            return html_keydown(event);
        });
    
        // Convert markdown to html
        function markdown2html() {
            var html_content = markdown.toHTML(ngModel.$viewValue || '', 'Maruku');
            element.html(html_content);
        }

		// Convert html to markdown
        function html2markdown() {
            var rootElement = element.contents()[0].parentNode;

            // Convert html to markdown
            var md = dom2markdown(rootElement, FILTER_NONE);

            // Remove opening newlines
            md = md.replace(/^\n+/, '');

            // Replace all sequences of three or more newlines with two newlines
            md = md.replace(/\n\n\n+/g, '\n\n');

            // Update the model
            ngModel.$setViewValue(md);

        }
	}
});
