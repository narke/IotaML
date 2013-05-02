// Author: Konstantin Tcholokachvili
// Date: 2013

//WTF:
// - infixs needs ';' but why
// - exp in the end isn't in the grammar


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
    // >> Constants <<
    INT         = space* <digit+>:d                      space*                                                                -> d,
    FLOAT       = space* <digit+ '.' digit+>:f           space*                                                                -> f,
    CHAR        = space* '\'' char:c '\''                space*                                                                -> c,
    STRING      = space* '"'  (``""'' | '\'' | space | ~'"' anything:s)* '"' space*                                            -> s,
    CONSTANT    = FLOAT
                | INT
                | CHAR
                | STRING,

    // >> Identifiers <<
    LOWER_ID    = ('/' | "mod" | '*' | '+' | '-' | '^' | "::" | '=' | '@' | ">=" | '>' | "<>" | '<' | "<=" | ":=")+:lower_id   -> lower_id
                | space* <lower+ ('_' lower+)*>:lower_id space*                                                                -> lower_id,
    UPPER_ID    = space* <upper+ ('_' upper+)*>:upper_id space*                                                                -> upper_id,
    LONG_ID     = LOWER_ID:lower_id ('.' LOWER_ID)*                                                                            -> lower_id,
    LAB         = LOWER_ID:id -> id
                | INT:i       -> i,

    // >> Expressions <<
    expression  = '(' expression:exp ')'                                                                        -> exp
                | '(' space* expression?:exp (space* ',' space* expression)* ')'                                -> exp
                | '{' exprow?:exp '}'                                                                           -> ['record', exp]
                | '[' space* expression?:exp (space* ',' space* expression)* ']'                                -> exp
                | '(' space* expression:exp space* ';' space* expression (space* ';' space* expression)* ')'    -> exp
                | "raise" expression:exp                                                                        -> exp
                | "while" expression:exp1 "do" expression:exp2                                                  -> ['while', exp1, exp2]
                | expression:exp1 LOWER_ID:op expression:exp2                                                   -> ['infix application', op, exp1, exp2]
                | CONSTANT:constant                                                                             -> constant
                | LONG_ID:l                                                                                     -> ['LID', l]
                | expression:exp "handle" match:m                                                               -> ['handle', exp, m]
                | expression:exp1 "and" expression:exp2                                                         -> ['and', exp1, exp2]
                | expression:exp1 "or" expression:exp2                                                          -> ['or', exp1, exp2],
    exprow      = LAB:lab space* '=' space* expression:exp (space* ',' space* exprow)*                          -> ['lab', lab, exp],


    // >> Patterns <<
    pattern     = space* '_':underscore space*                                                                  -> underscore
                | LOWER_ID:lower_id                                                                             -> lower_id,
    declaration = declaration:dec1 space* ';'? space* declaration:dec2                                          -> [dec1, dec2]
                | valbind:binding                                                                               -> binding
                | "exception" exnbind:except                                                                    -> ['exception', except]
                | "nonfix" LOWER_ID+:lower_id                                                                   -> ['nonfix', lower_id]
                | "infixr" space* <digit>?:n LOWER_ID+:lower_id                                                 -> ['infixr', n, lower_id]
                | "infix"  space* <digit>?:n LOWER_ID+:lower_id                                                 -> ['infix', n, lower_id],
    exnbind     = UPPER_ID:upper_id                                                                             -> upper_id,
    valbind     = space* pattern:id space* '=' space* expression:value                                          -> ['binding', id, value],
    program     = program:p1 space* ';'? space* program:p2                                                      -> [p1, p2]
                | declaration:dec                                                                               -> dec
                | expression:exp                                                                                -> exp
}


// Tests
test = 'nonfix aaa;
        infix 5 bbb;
        infixr 6 ccc;
        exception FILE_ERROR;
        a = 5;
        {a = 25};
        1 + 2;
        while a < 4 do
            a := a + 1;'

IotaML.matchAll(test, 'program', [], matchFailed)
