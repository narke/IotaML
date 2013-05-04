// Author: Konstantin Tcholokachvili
// Date: 2013

//WTF:
// - infixs needs ';' but why
// - exp at the end isn't in the grammar
// - concatenate LONG_ID
// - imperative access: !a
// - no ';' should be needed at the end of Color
// - for loop
// - qsort example

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
    INT         = space* <digit+>:d                      space*                                   -> d,
    FLOAT       = space* <digit+ '.' digit+>:f           space*                                   -> f,
    CHAR        = space* '\'' char:c '\''                space*                                   -> c,
    escape_char   = '\\' char:ec                                                                  -> unescape('\\' + ec),
    STRING      = space* '"' (escape_char | ~'"'  char)*:s '"' space*                             -> s.join(''),
    CONSTANT    = FLOAT
                | INT
                | CHAR
                | STRING,

    // >> Identifiers <<
    LOWER_ID    = ('/' | "mod" | '*' | '+' | '-' | '^' | "::" | '=' | '@' | ">=" | '>' | "<>" | '<' | "<=" | ":=")+:lower_id   -> lower_id
                | space* <lower+ ('_' lower+)*>:lower_id space*                                                                -> lower_id,
    MIXED_ID    = space* <upper letter+>:mixed_id space*                                                                       -> mixed_id,
    UPPER_ID    = space* <upper+ ('_' upper+)*>:upper_id space*                                                                -> upper_id,
    LONG_ID     = LOWER_ID:lower_id ('.' LOWER_ID)*                                                                            -> lower_id,
    LAB         = LOWER_ID:id                                                                                                  -> id
                | INT:i                                                                                                        -> i,

    // >> Expressions <<
    expression  = '(' expression:exp ')'                                                         -> ['#parenthesis', [].concat(exp)]
                | '(' listOf(#expression, ','):tuple_item ')'                                    -> ['#tuple', [].concat(tuple_item)]
                | '{' listOf(#exprow, ','):row '}'                                               -> ['#record', row]
                | '[' listOf(#expression, ','):list_item ']'                                  -> ["#list", list_item == undefined?[]:[].concat(list_item)]
                | ".{" listOf(#expression, ','):exp_n "}"                                         -> [].concat(exp_n)
                | "raise" expression:exp                                                         -> exp
                | "#if" expression:exp1 "#then" expression:exp2 "#else" expression:exp3          -> ['#if', exp1, exp2, exp3]
                | "#for" LOWER_ID:lower_id "#in" expression:exp  "#.{" listOf(#expression, ';'):exp_n '}' -> ['#for', lower_id, exp]
                | "while" expression:exp1 "#do" expression:exp2                                  -> ['#while', exp1, exp2]
                | expression:exp1 LOWER_ID:op expression:exp2                                    -> ['#infix_application', op, exp1, exp2]
                | CONSTANT:constant                                                              -> constant
                | LONG_ID:long_id                                                                -> long_id
                | UPPER_ID:upper_id                                                              -> upper_id
                | '#' LAB:lab                                                                    -> ['#record_access', lab]
                | expression:exp "handle" match:m                                                -> ['#handle', exp, m]
                | expression:exp1 "and" expression:exp2                                          -> ['#and', exp1, exp2]
                | expression:exp1 "or" expression:exp2                                           -> ['#or', exp1, exp2],
    exprow      = LAB:lab '=' expression:exp                                                     -> [lab, exp],

    // >> Patterns <<
    pattern     = CONSTANT:constant                                                             -> constant
                | '_':wildcard                                                                  -> wildcard
                | LOWER_ID:lower_id                                                             -> lower_id
                | '[' listOf(#pattern, ','):list_item ']'                                       -> [list_item == undefined?[]:[].concat(list_item)]
                | '(' listOf(#pattern, ','):tuple_item ')'                                      -> [].concat(tuple_item)
                | '{' listOf(#patrow, ','):record_item '}'                                      -> [].concat(record_item),
    patrow      = "...":ellipsis                                                                -> ellipsis
                | LAB:lab '=' pattern:pat listOf(#patrow, ','):pat_n                            -> [lab, pat, [].concat(pat_n)]
                | LOWER_ID:lower_id listOf(#patrow, ','):pat_n                                  -> [lower_id, [].concat(pat_n)],
    typ         = typ:t1 "->" typ:t2                                                            -> ['#typing_input', t1, '#typing_output', t2]
                | '(' listOf(#typ, ','):typ_item ')'                                            -> [].concat(typ_item)
                | MIXED_ID:mixed_id '(' typ:t ')'                                               -> [mixed_id, t]
                | MIXED_ID:mixed_id                                                             -> [mixed_id]
                | UPPER_ID:upper_id                                                             -> [upper_id],

    declaration = declaration:dec1 space* ';'? space* declaration:dec2                          -> [dec1, dec2]
                | datbind:databind                                                              -> databind
                | valbind:binding                                                               -> binding
                | "fun" LOWER_ID:lower_id funbind:fun_bind                                      -> ['#fun', lower_id, fun_bind]
                | "exception" exnbind:except                                                    -> ['#exception', except]
                | "nonfix" LOWER_ID+:lower_id                                                   -> ['#nonfix', lower_id]
                | "infixr" space* <digit>?:n LOWER_ID+:lower_id                                 -> ['#infixr', n, lower_id]
                | "infix"  space* <digit>?:n LOWER_ID+:lower_id                                 -> ['#infix', n, lower_id],
    valbind     = pattern:id '=' expression:value                                               -> ['#binding', id, value],
    funbind     = listOf(#funmatch, '|'):fun_match                                              -> fun_match,
    funmatch    = LOWER_ID:lower_id pattern:pat '=' expression:exp                              -> [lower_id, pat, exp]
                | pattern:pat1 LOWER_ID:lower_id pattern:pat2 '=' expression:exp                -> [pat1, lower_id, pat2, exp]
                | pattern:pat space* '=' expression:exp                                         -> [pat, exp],
    datbind     = MIXED_ID:mixed_id '=' listOf(#conbind, '|'):conbind_n                         -> ['#datbind', mixed_id, [].concat(conbind_n)],
    conbind     = UPPER_ID:upper_id typ?:t                                                      -> (t == undefined?[upper_id]:[upper_id, t]),
    exnbind     = UPPER_ID:upper_id                                                             -> upper_id,
    sig         = spec:s                                                                        -> s,
    spec        = valdesc:v ';'? spec:s                                                         -> [v, s]
                | datdesc:d ';'? spec:s                                                         -> [d, s]
                | typdesc:t ';'? spec:s                                                         -> [t, s]
                | "exception" exndesc:e ';'? spec:s                                             -> ['#exception', e, s]
                | empty                                                                         -> ['#empty'],
    valdesc     = LOWER_ID:lower_id ':' space* typ:t                                            -> ['#func_name', lower_id, '#func_types', t],
    typdesc     = MIXED_ID:mixed_id ('(' typ:t ')')?                                            -> (t == undefined?[mixed_id]:[mixed_id, t]),
    datdesc     = MIXED_ID:mixed_id '=' listOf(#condesc, '|'):condesc_n                         -> ['#datdesc',mixed_id, [].concat(condesc_n)],
    condesc     = UPPER_ID:upper_id typ?:t                                                      -> (t == undefined?[upper_id]:[upper_id, t]),
    exndesc     = UPPER_ID:upper_id typ?:t                                                      -> (t == undefined?[upper_id]:[upper_id, t]),
    sigbind     = MIXED_ID:mixed_id '=' sig:si                                                  -> ['#ddd', mixed_id, si]
                | '_':wildcard '=' sig:si                                                       -> [wildcard, si],
    program     = program:p1 space* ';'? space* program:p2                                      -> [p1, p2]
                | "signature" sigbind:s                                                         -> ['#signature', s]
                | declaration:dec                                                               -> dec
                | expression:exp                                                                -> exp
}

// Tests
tests = 'nonfix aaa;
        infix 5 bbb;
        infixr 6 ccc;
        exception FILE_ERROR;
        a = 5;
        {a = 25};
        1 + 2;
        while a < 4 #do
            a := a + 1;
        #if a < 10 #then 0 #else 1;
        fun max a b = #if a > b #then a #else b;
        (1, 2, 3);
        fun fact 0 = 0 
          | fact n = n * (n-1);
        {a = 1, b = 2, c = 3};
        [5, 6, 7];
        a = ("string", \'a\', 1, 1.0);
        print ("%d %d", a, b);
        Color = RED | GREEN | BLUE;
        Point = TWO_D (Real, Real) | THREE_D (Real, Real, Real);
        signature MyApi = say_hello : Unit -> Unit;
        signature MyApi =
            Rectangle
            Color = RED | GREEN | BLUE;
            Point = TWO_D (Real, Real) | THREE_D (Real, Real, Real)
            say_hello: Unit -> Unit
            mult:   (Int, Int) -> Int
            sum:    ((Real, Real), (Real, Real)) -> Real
            exception VALUE_ERROR;'

IotaML.matchAll(tests, 'program', [], matchFailed)
