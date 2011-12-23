# Emmett - a tiny documentation parser with 1.21 gigawatt

Emmett is a tiny (about 3kb when minified) but flexible helper for extracting @Javadoc-style comments from sourcecode. 
It outputs a JSON representation of your doc-comments that you can use with a template-engine of your choice to create HTML documentation.
It's designed for use in Javascript, but could be used with many languages since it parses only comments, not code. 

## Status



## Comments


Comments are very similiar to Javadocs but you can make up any tag you like.. @knock yourself out! 
The only requirement is that the thing you are commenting has to be named (e.g. via the @name tag). 

### A simple example:


```javascript

  /**
   * You can put a description first, but that's optional.
   * The asterisks here are also not necessary if you don't like them.
   * @name add
   * @param a {number} the first number
   * @param b {number} the second number
   * @return {number} Guess what?
   * @MyLittlePony Make your own tags if you like. It's your documentation, dude..
   */
  function add(a, b){
    return a + b;
  }

```

Emmett will output the following JSON structure (without the comments):

```javascript

{
  "add": {
    "name": "add",
    "description": "You can put a description first, but that's optional. \n The asterisks here are also not necessary if you don't like them.",
    "param": [
      {
        "name": "a",
        "type": "number",
        "description": "the first number"
      },
      {
        "name": "b",
        "type": "number",
        "description": "the second number"
      }
    ],
    "return": {
      "type": "number",
      "description": "Guess what?"
    },
    "MyLittlePony": "Make your own tags if you like. It's your documentation, dude.."
  }
}

```

The only required tag was @name, because this will be used as the key in the generated JSON. 
Actually none of the tags has to match with your code but you probably want to use names that match your code, so people can use it (:


### A little more complex example


```javascript

/**
 * Since the at-character is used for tags, you have to escape it if you want to use it in descriptions:
 * You can also use \@function <name> or \@field <name> instead of \@name <name> for added metadata. If none of the is present the comment will be ignored.
 * @function MyClass
 */
var MyClass = function(){}

/**
 * This comment will be ignored, since we don't have a name for it.
 */
MyClass.prototype = {
  /**
   * foo is a member of MyClass.prototype, so we have to name it accordingly to get that.
   * Again, you could name it anything you like, but I only "MyClass.foo" or "MyClass.prototype.foo" really makes sense.
   * @function MyClass.prototype.foo
   */
  foo: function(){},
  /**
   * The function above really has a long name. We can use the \@namespace tag to tell emmett that everything after this should be members of MyClass.prototype:
   * @namespace MyClass.prototype
   * @name bar
   */
  bar: function(){},
  /**
   * The \@namespace is still set to MyClass prototype, so this will be put in there too.
   * @name baz
   */
  baz: function(){}
};

```

This will result in the following JSON output:

```javascript

{
  "MyClass": {
    "name": "MyClass",
    "description": "Since the at-character is used for tags, you have to escape it if you want to use it in descriptions:\nYou can also use \\@function <name> or \\@field <name> instead of \\@name <name> for added metadata. If none of the is present the comment will be ignored.",
    "prototype": {
      "foo": {
        "name": "foo",
        "description": "foo is a member of MyClass.prototype, so we have to name it accordingly to get that.\nAgain, you could name it anything you like, but I only \"MyClass.foo\" or \"MyClass.prototype.foo\" really makes sense."
      },
      "bar": {
        "name": "bar",
        "description": "The function above really has a long name. We can use the \\@namespace tag to tell emmett that everything after this should be members of MyClass.prototype:"
      },
      "baz": {
        "name": "baz",
        "description": "The \\@namespace is still set to MyClass prototype, so this will be put in there too."
      }
    }
  }
}

```


## Usage


You pass sourcecode in by piping it through stdin and get a JSON description of your comments on stdout.

```

cat mycode.js | emmet > mycode.json

```

You could also pass the JSON to mustache or any other templating engine instead of saving it in a file.



## Roll your own


If you don't like the structure emmett chooses for it's JSON or you don't want to go through JSON at all you can use only the parser and do the processing yourself. You can register callbacks that fire when a comment starts, ends, for every tag and the description.

The parser should work in nodeJS and any browser.

```javascript

// in node:
var Parser = require('./lib/parser.js');
var p = new Parser();
// in a browser with an AMD loader:
require(['emmet/Parser'], function(Parser){
  var p = new Parser();
});
// in a browser without AMD loader:
var Parser = window.emmet.Parser;
var p = new Parser();

// after you made a parser you can hook into the parsing process and do some stuff 

// start of a comment
p.on('/**', function(){
  console.log('Here goes a comment!');
});
// end of a comment
p.on('*/', function(){
  console.log('Here ends a comment!');
});
// match @name tags
p.on('name', function(tagName, value){
  console.log('Found a @name tag. Value: ' + value);
});
// match any tag
p.on(function(tagName, value){ 
  console.log("Found a @"+tagName+" tag. Value: ' + value);
});

// start parsing
p.parse(someCodeStringToParse);


```




## License


Emmett is licensed under the terms of the MIT license: http://murphy.mit-license.org/



## What's with the weird name? ಠ_ಠ

Well, it's about docs, so I named it after the best doc of all.. Doctor Emmett "Doc" Brown. (:
