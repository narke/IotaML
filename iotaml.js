// Author: Konstantin Tcholokachvili
// Date: 2013


matchFailed = function (grammar, errorPos) {
  var lines = grammar.input.lst.split('\n');
  var pos = 0, l = 0;
  var msg = ["Execution error: input matching failed at position: " + errorPos];

  while (pos < errorPos) {
    var line = lines[l], length = line.length;
    if (pos + length >= errorPos) {
      var c = errorPos - pos;
      msg.push("  line:" + (l + 1) + ", column:" + c);
      msg.push(line)
      // replicate str n times
      function replicate(str, n) {
        if (n < 1) return "";
        var t = [];
        for (var i=0; i<n; i++) t.push(str);
        return t.join('');
      }
      msg.push(replicate('-', c) + '^');
    }
    pos += length + 1;
    l++;
  }
  alert(msg.join('\n'));
}

ometa IotaML {
    LOWER_ID    = space* <lower+ ('_' lower+)*>:lower_id space*                                                                -> lower_id
                | ('/' | "mod" | '*' | '+' | '-' | '^' | "::" | '=' | '@' | ">=" | '>' | "<>" | '<' | "<=" | ":=")+:lower_id   -> lower_id,
    UPPER_ID    = space* <upper+ ('_' upper+)*>:upper_id space*                                                                -> upper_id,
    INT         = space* <digit+>:d space*                                                                                     -> d,
    FLOAT       = space* <digit+ '.' digit+>:f space*                                                                          -> f,
    CHAR        = space* '\'' char:c '\'' space*                                                                               -> c,
    STRING      = space* '"'  (``""'' | '\'' | space | ~'"' anything:s)* '"' space*                                            -> s,
    CONSTANT    = FLOAT
                | INT
                | CHAR
                | STRING,

    expression  = CONSTANT:constant                                                                                            -> constant,

    pattern     = space* '_':underscore space*                                                                                 -> underscore
                | LOWER_ID:lower_id                                                                                            -> lower_id,

    declaration = declaration:dec1 space* ';'? space* declaration:dec2                                                         -> [dec1, dec2]
                | valbind:binding                                                                                              -> binding
                | "exception" exnbind:except                                                                                   -> ['exception', except]
                | "nonfix" LOWER_ID+:lower_id                                                                                  -> ['nonfix', lower_id]
                | "infixr" space* <digit>?:n LOWER_ID+:lower_id                                                                -> ['infixr', n, lower_id]
                | "infix"  space* <digit>?:n LOWER_ID+:lower_id                                                                -> ['infix', n, lower_id],
    exnbind     = UPPER_ID:upper_id                                                                                            -> upper_id,
    valbind     = space* pattern:id space* '=' space* expression:value                                                         -> ['binding', id, value],
    program     = program:p1 space* ';'? space* program:p2                                                                     -> [p1, p2]
                | declaration:dec                                                                                              -> dec
}


// Tests
test = 'nonfix aaa;
        infix 5 bbb;
        infixr 6 ccc;
        exception FILE_ERROR
        a = 5'



IotaML.matchAll(test, 'program', [], matchFailed)
