# Emmett - a tiny documentation parser with 1.21 gigawatt

Emmett is a tiny (about 3kb when minified) but flexible helper for extracting @Javadoc-style comments from sourcecode. 
It outputs a JSON representation of your doc-comments that you can use with a template-engine of your choice to create HTML documentation.
It's designed for use in Javascript, but could be used with many languages since it parses only comments, not code. 


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

Emmett will output the following JSON structure:

```javascript

[
  {
      "name": "add",
      "param": [
        {
            "optional": false,
            "name": "a",
            "description": "{number} the first number"
        }, 
        {
            "optional": false,
            "name": "b",
            "description": "{number} the second number"
        }
      ],
      "return": {
          "type": "number",
          "description": ""
      },
      "MyLittlePony": "Make your own tags if you like. It's your documentation, dude..",
      "description": "You can put a description first, but that's optional.\nThe asterisks here are also not necessary if you don't like them."
  }
]

```

The only required tag was @name, because this will be used to sort the generated JSON if multiple comments have been parsed (see example below).
Actually none of the tags has to match with your actual sourcecode but you probably want to use names that match your code, so people can use it (:


### A little more complex example


```javascript

/**
 * Since the at-character is used for tags, you have to escape it if you want to use it in descriptions:
 * You can also use \@function <name> or \@field <name> instead of \@name <name> for added metadata. If none of these is present the comment will be ignored.
 * @function MyClass
 */
var MyClass = function(){}

/**
 * This comment will be ignored, since we don't have a name for it.
 */
MyClass.prototype = {
  /**
   * foo is a member of MyClass.prototype, so we have to name it accordingly to get that in the output data.
   * Again, you could name it anything you like, but only something like "MyClass.foo", "MyClass.prototype.foo" or "MyClass.member.foo" really makes sense here.
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
[
  {
      "function": true,
      "name": "MyClass",
      "description": "Since the at-character is used for tags, you have to escape it if you want to use it in descriptions:\nYou can also use @function <name> or @field <name> instead of @name <name> for added metadata. If none of these is present the comment will be ignored.",
      "namespace": ""
  }, {
      "name": "bar",
      "description": "The function above really has a long name. We can use the @namespace tag to tell emmett that everything after this should be members of MyClass.prototype:",
      "namespace": "MyClass.prototype"
  }, {
      "name": "baz",
      "description": "The @namespace is still set to MyClass prototype, so this will be put in there too.",
      "namespace": "MyClass.prototype"
  }, {
      "function": true,
      "name": "foo",
      "description": "foo is a member of MyClass.prototype, so we have to name it accordingly to get that in the output data.\nAgain, you could name it anything you like, but only something like \"MyClass.foo\", \"MyClass.prototype.foo\" or \"MyClass.member.foo\" really makes sense here.",
      "namespace": "MyClass.prototype"
  }
]

```

Note that the output is ordered by namespace, then by name (that's why MyClass.prototype.foo" is last in the output).


### Naming and namespaces

For a comment to appear in the output you have to name it with @name or something similiar. If you have to name nested structures (like above) or packages you can also use a full path like @name MyLib.MyNamespace.MyClass . In this case the output would be something like this:

```

/**
 * @name MyLib.MyNamespace.MyClass
 */
{
  "name": "MyClass",
  "namespace": "MyLib.MyNamespace"
  //, ...
}

```
The namespace and the name form the fully qualified name (fqn). The last part of the fqn will be used for the name attribute in the output, the rest as namespace. The following comments would create the same output as above:

```

/**
 * @namespace MyLib
 * @name MyNamespace.MyClass
 */

```
```

/**
 * @namespace MyLib. MyNamespace
 * @name MyClass
 */

```

# General comment format and build in tags.

The general format is the one specified by the Javadoc spec. 

```
/** 
 * DESCRIPTION 
 * Can be multiline
 * First at-sign ends the descriptions
 * @TAG1 VALUE
 * @TAG2 VALUE
 * Can also be multiline
 * @TAG3 VALUE
 */
```

The following tags are build into the default formatter :

* @name NAME : the only required tag. If the @name is not a path (contains no .) then the output will be the same as NAME, otherwise it will be the part after the last period.   
* @namespace NS : makes every @name after this part of the NS namespace. Even if you don't need a namespace in a file it's probably a good idea to add a @namespace tag (with NS = "") at the top of the file to reset the namespace. That way you can concat all your Javascript without having to worry about messing namespaces up.
* @function NAME : alias for @name. Sets the .name attribute in the output and adds a boolean "function" attribute.
* @class NAME : alias for @name. Same as @function, only that it sets a boolean "class" attribute. Use for constructor functions.
* @object NAME : alias for @name. Same as @function, only that it sets a boolean "object" attribute. Use for plain objects (singletons, etc..)
* @field NAME : alias for @name. Same as @function, only that it sets a boolean "field" attribute. Use for object members and static fields.
* @param {TYPE} NAME=DEFAULTVALUE DESCRIPTION : Used to describe parameters to functions. [Here's an in-depth description of this tag](http://code.google.com/p/jsdoc-toolkit/wiki/TagParam).
* @return {TYPE} DESCRIPTION : Describes the return value of a function.
* @private : marks a function or object as private. Adds a boolean "private" attribute to the output.
* @deprecated : marks a function or object as deprecated. Adds a boolean "deprecated" attribute to the output.



## Usage


You pass sourcecode in by piping it through stdin and get a JSON description of your comments on stdout.

```

cat mycode.js | emmett > mycode.json

```

You could also pass the JSON to mustache or any other templating engine instead of saving it in a file.


## Roll your own format


If you don't like the structure emmett chooses for it's JSON or you don't want to go through JSON at all you can use only the parser and do the processing yourself. You can register callbacks that fire when a comment starts, ends, for every tag and the description.

The parser should work in nodeJS and any browser.

```javascript

// in node:
var Parser = require('./lib/parser.js');
var p = new Parser();
// in a browser with an AMD loader:
require(['emmett/Parser'], function(Parser){
  var p = new Parser();
});
// in a browser without AMD loader:
var Parser = window.emmett.Parser;
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
