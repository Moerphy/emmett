(function(undefined){
  /**
   * @module 
   */

  var Parser = function(code){
    this.pos = 0;
    this.code = '';
    this.callbacks = {};
    this.tagMarker = '@';
  };


  Parser.prototype = {
    /**
     * Parses a code file for javadoc style comments
     */
    parse: function(code){
      this.code = code;
      this.pos = 0;
      for( ; this.pos < this.code.length; ++this.pos ){
        var c = this.code.charAt(this.pos);
        var lastC = '';
        switch(c){
          case '\'':  
            lastC !== '\\' && this.readString('\''); // if char is ' (and not \') skip until end of string
            break; 
          case '"': 
            lastC !== '\\' && this.readString('"'); // if char is " (and not \") skip until end of string
            break;
          case '/': // maybe a doc comment
            // check for // comments
            if( this.pos+1 < this.code.length && this.code.charAt(this.pos+1) === '/' ){
              // skip ahead until the end of the line
              this.readString('\n');
            }else{ // could be a comment, try reading
              var docComment = this.readDocComment(); // try to read a doc comment
              if( docComment ){
                this.parseComment(docComment);
              }
            }
            
            break;
        };
        lastC = c;
      }
    },
    
    /**
     * Advances the position until the matching delimiter is found.
     */
    readString: function(delimiter){
      var c;
      var lastC;
      for( var i = this.pos + 1; i < this.code.length && c !== delimiter && lastC !== '\\'; ++i ){
        lastC = c;
        c = this.code.charAt(i);
      }
      this.pos = i;
    },
    
    /**
     * Tries to read a doc comment from the current position.
     * Returns an empty string if there is no doc comment at this position
     */
    readDocComment: function(){
      var comment = '';
      
      var commentStart = this.code.substr( this.pos, 3 );
      if( commentStart === '/**' ){ // only parse javadoc comments
        for( var i = this.pos + 3; i < this.code.length; ++i ){
          var c = this.code.substr(i, 2);
          if( c === '*/' ){
            break;
          }
        }
        comment = this.code.substring( this.pos + 3, i ); // read without the /** */ pair
        this.pos = i;
      }
      
      return comment;
    },
    
    /**
     * Parse one doc comment, with or without the / * * / pair
     */
    parseComment: function(commentString){
      var doc = {}; // what's up doc?
      
      commentString = commentString.replace(/^\s+|\s+$/g,''); // commentString.trim() for compat
      var trimRange = [0, commentString.length];
      if( commentString.indexOf('/**') === 0 ){ // remove leading /**
        trimRange[0] = 4;
      }
      if( commentString.indexOf('*/') === commentString.length -2 ){ // remove trailing */
        trimRange[1] = commentString.length - 2;
      }
      commentString = commentString.substring(trimRange[0], trimRange[1]);
      commentString = commentString.replace(/^[\s\*]*/gm,''); // replaces whitespace and * at the beginning of each line of comments
      
      // read description and remove it from the original string
      var desc = this.readDescription(commentString);
      commentString = commentString.substring(desc.length, commentString.length);
      var tags = this.readTags(commentString);
      
      this.trigger('/**', '');
      for( var i = 0; i < tags.length; ++i ){
        var tag = tags[i];
        this.trigger( tag.name, tag.value );
      }
      // trigger this last, because there may be name info that has to be fired first
      this.trigger( 'description', desc );
      this.trigger('*/', '');
    },
    
    /**
     * Read the content of the comment until the first @.
     * This specifies the end of the description (according to oracle).
     */
    readDescription: function(comment){
      for( var i = 0; i < comment.length; ++i ){
        if( comment[i] === this.tagMarker && comment[i-1] !== '\\' ){
          break;
        }
      } // read until next @. respect escaped @: \@
      return comment.substring(0, i);
    },
    
    readTags: function(comment, pos){
      var tags = [];
      var regexp = /@(\S+) ([^@]+)/g; // TODO: regexp as string, pull out @ to attribute
      
      while( match = regexp.exec(comment) ){
        tags.push({
          name: match[1],
          value: match[2]
        });
      }
      
      return tags;
    },
    
    
    on: function(tagName, processor){
      if( arguments.length === 1 ){
        processor = tagName;
        tagName = '*';
      }
      var callbacks = this.callbacks[tagName] = this.callbacks[tagName] || [];
      callbacks.push(processor);
    },
    
    off: function(tagName, processor){
      var callbacks = this.callbacks[tagName]
      if( callbacks ){
        if( processor ){
          for( var i = 0; i < callbacks.length; ++i ){
            if( callbacks[i] === processor ){
              callbacks.splice(i, 1);
            }
          }
        }else{
          callbacks.length = 0;
        }
      }
    },
    
    trigger: function(tagName, content){
      var callbacks = this.callbacks[tagName] || [];
      Array.prototype.push.apply( callbacks, this.callbacks['*'] || [] ); // add universal callbacks
      for( var i = 0; i < callbacks.length; ++i ){
        callbacks[i].call(this, tagName, content); // TODO: is there any context that might be useful here?
      }
    },
    
    reset: function(){
      this.callbacks = {};
      this.pos = 0;
      this.code = '';
    }
    
  };

  if( module ){
    module.exports = Parser;
  }else if( window ){
    if( window.define ){
      define( 'emmet/Parser', [], function(){ return Parser; } );
    }else{
      window.emmet = window.emmet || {};
      window.emmet.Parser = Parser;
    }
    
  }
})();

