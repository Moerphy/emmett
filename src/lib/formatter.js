(function(undefined){

  var Formatter = function(parser){
    var that = this;
    this.root = {};
    this.parser = parser;
  };


  Formatter.prototype = {
    /**
     * 
     */
    format: function(code){
      var that = this;
      this.root = {};
      this.current = {};
      this._namespace = '';
      
      this.parser.on(function(tag, value){
        tag = tag.trim();
        value = value.trim();
        if( typeof that[tag] === 'function' ){
          that[tag](value);
        }else if(tag && value){
          that.tag(tag, value);
        }
      });
      this.parser.parse(code);
      
      return this.root;
    },
    
    saveCurrent: function(){
      if( this.current.name ){
        var path = (this._namespace + '.' + this.current.name).split('.');
        
        var name = path.pop();
        this.current.name = name;
        var current = this.root;
        for( var i = 0; i < path.length; ++i ){
          var p = path[i];
          if( !current[p] ){
            current[p] = {};
          }
          current = current[p];
        }
        if( current[name] ){
          if( current[name].prototype && typeof current[name].prototype.push === 'function' ){
            current[name].push(this.current);
          }else{
            current[name] = [ current[name], this.current ];
          }
        }else{
          current[name] = this.current;
        }
      }
    },
    
    tag: function(tag, value){
      this.current[tag] = value;
    },
    
    '/**': function(){
      this.current = {};
    },
    '*/': function(){
      this.saveCurrent();
      this.current = undefined;
    },
    'namespace': function(value){
      this._namespace = value;
      
    },
    'name': function(value){
      this.current.name = value;
    },
    'function': function(value){
      this.tag('function', true);
      this.name(value);
    },
    'class': function(value){
      this.tag('class', true);
      this.name(value);  
    },
    'object': function(value){
      this.tag('object', true);
      this.name(value);
    },
    'field': function(value){
      this.tag('field', true);
      this.name(value);
    },
    'description': function(value){
      this.current.description = value;
    },
    'param': function(value){
      var paramData = {};
      this.current.param = this.current.param || [];
      
      // parse name, type and optional values
      // uses the JSDOC syntax for params: @param {String} [name="defaultvalue"] Some description
      // matches different variations of the tag like this:
      // ["{string} foo blabla", "string", undefined, undefined, undefined, "foo", " blabla"]
      // ["{string} [foo] blabla", "string", undefined, undefined, "foo", undefined, " blabla"]
      // ["{string} [foo=a] blabla", "string", "foo", "a", undefined, " blabla"]
      var parser = /(?:\{([^\}]+)\})?\s*(?:\[([^=]+)=([^\]]+)\]|\[([^\]]+)\]|(\S+))\s*(.*)?/gi;
      var match = parser.exec( value );
      
      if( match ){
        // matched a type? {type}
        if( match[1] ){
          paramData.type = match[1];
        }
        // matched a optional parameter with default value? [name=defaultValue]
        if( match[2] && match[3] ){
          paramData.optional = true;
          paramData.name = match[2];
          paramData.defaultValue = match[3];
        }else if( match[4] ){ // matched an optional parameter without default value: [name]
          paramData.optional = true;
          paramData.name = match[4];
        }else if( match[5] ){ // matched mandatory parameter
          paramData.optional = false;
          paramData.name = match[5];
        }
        // matched description
        if( match[6] ){
          paramData.description = match[6];
        }
      }else{
        paramData.description = value;
      }
      this.current.param.push(paramData);
    },
    
    'return': function(value){
      var returnData = {};
      
      var parser = /(?:\{([^\}]+)\})?(.*?)/gi;
      var match = parser.exec(value);
      if( match ){
        returnData.type = match[1];
        returnData.description = match[2];
      }else{
        returnData.description = value;
      }
      
      this.current['return'] = returnData;
    },
    
    'private': function(value){
      this.tag('private', true);
    },
    'deprecated': function(value){
      this.tag('deprecated', true);
    }
  };

  if( module ){
    module.exports = Formatter;
  }else if( window ){
    if( define && define.amd ){
      define( 'emmett/Formatter', [], function(){ return Formatter; } );
    }else{
      window.emmett = window.emmet || {};
      window.emmett.Formatter = Formatter;
    }
  }
})();

