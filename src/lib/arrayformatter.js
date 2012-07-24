/**
 * Puts all the comment information in one array, sorted by name.
 * Example: 
 * [ { name: 'foo', object: true, value1: 123, value2: 1234 }, { name: 'foobar', function: true, value1: 456, bla:'abc' }, { name: 'xyz', val: 'abc', object: true } ]
 * 
 */

(function(undefined){

  var Formatter = function(parser){
    var that = this;
    this.root = []
    this.parser = parser;
    this.current = undefined;
  };


  Formatter.prototype = {
    /**
     * 
     */
    format: function(code){
      var that = this;
      this.root = [];
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
      this.root.sort( this.sortRoot );
      
      return this.root;
    },
    
    sortRoot: function( a, b ){
      // 
      var aFullName = (a.namespace + '.' + a.name).toLowerCase();
      var bFullName = (b.namespace + '.' + b.name).toLowerCase();
      
      var index = 0;
      if( aFullName > bFullName ){
        index = 1;
      }else if( aFullName < bFullName ){
        index = -1;
      }
      //console.log("Comparing: " + aFullName + " / " + bFullName + " -> " + aFullName.localeCompare(bFullName) );
      return index;
    },
    
    saveCurrent: function(){
      if( this.current.name ){
        var namespace = this._namespace || '';
        var fullName = (namespace + '.' + this.current.name).split('.').filter(function(n){ return n.length });
        this.current.name = fullName.pop();
        
        this.current.namespace = fullName.join('.');
        this.root.push( this.current );
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

