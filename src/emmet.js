var Parser = require('./lib/parser.js');

var data = '';

// read from stdin
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk) {
  data += chunk;
});

process.stdin.on('end', function () {
  var p = new Parser(data);

  var comments = {};
  var currentComment = comments;
  var namespace = '';
  var commentData;
  
  // save current comment object at the end of a comment
  var setCurrent = function(str){
    if( str ){
      str = str.trim().split('.');
      currentComment = comments;
      for( var i = 0; i < str.length; ++i ){
        currentComment = currentComment[ str[i] ] = currentComment[ str[i] ] || {};
      }
    }else{
      currentComment = comments;
    }
    
  };

  // callbacks for the most commonly used tags in documentations
  var callbacks = {
    '/**': function(){
      commentData = {};
      setCurrent( namespace );
    },
    '*/': function(){
      var name = commentData.name || commentData['function'] || commentData['field'];
      if( name ){
        var fullName;
        if( namespace ){
          fullName = namespace + '.';
        }else{
          fullName = '';
        } 
        fullName += name;
        
        var splitName = fullName.split('.');
        name = splitName.pop();
        var path = splitName.join('.');
        
        setCurrent( path );

        commentData.name = name;

        if( currentComment[name] ){
          if( !currentComment[name].splice ){
            currentComment[name] = [ currentComment[name] ];
          }
          currentComment[name].push(commentData);
        }else{
          currentComment[name] = commentData;
        }
        
        
        commentData = undefined;
      }
    },
    'namespace': function(value){
      namespace = value;
    },
    'name': function(value){
      commentData['name'] = value;
    },
    'field': function(value){
      this.name(value);
    },
    'function': function(value){
      this.name(value);
    },
    'description': function(value){
      commentData.description = value;
    },
    'param': function(value){
      var paramData = {};
      commentData.param = commentData.param || [];
      
      // parse name, type and optional values
      // uses the JSDOC syntax for params:
      // @param {String} [name="defaultvalue"] Some description
      // TODO
      var parser = /(?:\{([^\}]+)\})?(\[?[^=\]]+(?:=([^\]]+))?\]?)(.*)?/;
      
      commentData.param.push(paramData);
    },
    
    'tag': function(name, value){
      var tags = commentData[name] = commentData[name] || [];
      tags.push(value);
    }
  };

  p.on(function(tag, value){
    tag = tag.trim();
    value = value.trim();
    if( callbacks[tag] ){
      callbacks[tag](value);
    }else if(tag && value){
      callbacks.tag(tag, value);
    }
  });

  p.parse();

  console.log( JSON.stringify(comments) );
});
