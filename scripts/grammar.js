// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "main", "symbols": ["statement"], "postprocess": ([statement]) => construct_parse_tree_node('main', 'statement', {statement})},
    {"name": "statement$ebnf$1", "symbols": []},
    {"name": "statement$ebnf$1$subexpression$1", "symbols": ["b_term", "or_symbol"]},
    {"name": "statement$ebnf$1", "symbols": ["statement$ebnf$1", "statement$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "statement", "symbols": ["statement$ebnf$1", "b_term"], "postprocess":  ([b_term_or_symbol_pair_array, final_b_term]) => {
          let b_term_array = b_term_or_symbol_pair_array.map(pair => pair[0]);
          b_term_array.push(final_b_term);
          return construct_parse_tree_node('statement', DISJUNCTION_RULE, {b_term_array});
        } },
    {"name": "b_term$ebnf$1", "symbols": []},
    {"name": "b_term$ebnf$1$subexpression$1", "symbols": ["b_factor", "and_symbol"]},
    {"name": "b_term$ebnf$1", "symbols": ["b_term$ebnf$1", "b_term$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "b_term", "symbols": ["b_term$ebnf$1", "b_factor"], "postprocess":  ([b_factor_and_symbol_pair_array, final_b_factor]) => {
          let b_factor_array = b_factor_and_symbol_pair_array.map(pair => pair[0]);
          b_factor_array.push(final_b_factor);
          return construct_parse_tree_node('b_term', CONJUNCTION_RULE, {b_factor_array});
        } },
    {"name": "b_factor", "symbols": ["left_paren", "statement", "right_paren"], "postprocess":  function([left_paren, statement, right_paren], location) {
          return construct_parse_tree_node('b_factor', BFACTOR_TO_PARENTHESISED_STATEMENT_RULE, {left_paren, statement, right_paren});
        } },
    {"name": "b_factor", "symbols": ["equality"], "postprocess":  function([equality], location) {
          return construct_parse_tree_node('b_factor', BFACTOR_TO_EQUALITY_RULE, {equality});
        } },
    {"name": "equality$ebnf$1$subexpression$1", "symbols": ["expression", "equal_symbol"]},
    {"name": "equality$ebnf$1", "symbols": ["equality$ebnf$1$subexpression$1"]},
    {"name": "equality$ebnf$1$subexpression$2", "symbols": ["expression", "equal_symbol"]},
    {"name": "equality$ebnf$1", "symbols": ["equality$ebnf$1", "equality$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "equality", "symbols": ["equality$ebnf$1", "expression"], "postprocess":  function(data) {
          /*
          data: [[...[expression, '=']], final_expression]
          */
          let expression_array = [];
          let num_chars = 0;
          for(let k = 0; k < data[0].length; k++) {
            expression_array.push(data[0][k][0]);
            num_chars += 1; // for the equal sign
          }
          expression_array.push(data[1]);
          num_chars += expression_array.reduce((acc, curr) => acc + determine_num_chars(curr), 0);
          return construct_parse_tree_node('equality', EQUALITY_RULE, {expression_array}, null, num_chars);
        } },
    {"name": "expression$ebnf$1", "symbols": ["sign"], "postprocess": id},
    {"name": "expression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expression$ebnf$2", "symbols": []},
    {"name": "expression$ebnf$2$subexpression$1", "symbols": ["sign", "u_term"]},
    {"name": "expression$ebnf$2", "symbols": ["expression$ebnf$2", "expression$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "expression", "symbols": ["expression$ebnf$1", "u_term", "expression$ebnf$2"], "postprocess":  function([first_sign, first_u_term, sign_u_term_pairs], location) {
          // initialize sign_u_term_pair_array with first pair
          let sign_u_term_pair_array = [construct_parse_tree_node('sign_u_term_pair', '', {sign: first_sign, u_term: first_u_term}, location, (first_sign !== null ? first_sign.num_chars : 0) + first_u_term.num_chars)];
          // add pairs to sign_u_term_pair_array, while tallying num_chars
          for(let pair of sign_u_term_pairs) {
            sign_u_term_pair_array.push(construct_parse_tree_node('sign_u_term_pair', '', {sign: pair[0], u_term: pair[1]}, pair[0].location, pair[0].num_chars + pair[1].num_chars));
          }
          return construct_parse_tree_node('expression', ADDITION_RULE, {sign_u_term_pair_array});
        } },
    {"name": "func$ebnf$1", "symbols": []},
    {"name": "func$ebnf$1$subexpression$1", "symbols": ["comma", "expression"]},
    {"name": "func$ebnf$1", "symbols": ["func$ebnf$1", "func$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "func", "symbols": ["u_variable", "left_paren", "expression", "func$ebnf$1", "right_paren"], "postprocess":  function([u_variable, left_paren, first_expression, comma_expression_pair_array, right_paren]) {
          return construct_parse_tree_node('func', 'func_rule', {
            u_variable,
            expression_array: [first_expression, ...comma_expression_pair_array.map(pair => pair[1])],
            comma_array: comma_expression_pair_array.map(pair => pair[0]),
            left_paren,
            right_paren
          });
        } },
    {"name": "u_term$ebnf$1", "symbols": []},
    {"name": "u_term$ebnf$1$subexpression$1", "symbols": ["scale_operator", "u_factor"]},
    {"name": "u_term$ebnf$1", "symbols": ["u_term$ebnf$1", "u_term$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "u_term", "symbols": ["u_factor", "u_term$ebnf$1"], "postprocess":  function([first_u_factor, pair_array]) {
          let operator_u_factor_pair_array = [
            construct_parse_tree_node('operator_u_factor_pair', '', {operator: null, u_factor: first_u_factor})
          ];
          for(let pair of pair_array) {
            operator_u_factor_pair_array.push(construct_parse_tree_node('operator_u_factor_pair', '', {operator: pair[0], u_factor: pair[1]}));
          }
          return construct_parse_tree_node('u_term', SCALE_RULE, {operator_u_factor_pair_array});
        } },
    {"name": "u_factor", "symbols": ["left_paren", "expression", "right_paren"], "postprocess":  function([left_paren, expression, right_paren], location) {
          return construct_parse_tree_node('u_factor', UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE, {left_paren, expression, right_paren});
        } },
    {"name": "u_factor", "symbols": ["func"], "postprocess":  function([func]) {
          return construct_parse_tree_node('u_factor', UFACTOR_TO_FUNC_RULE, {func});
        } },
    {"name": "u_factor", "symbols": ["u_variable"], "postprocess":  function([u_variable]) {
          return construct_parse_tree_node('u_factor', UFACTOR_TO_UVARIABLE_RULE, {u_variable});
        } },
    {"name": "u_factor", "symbols": ["u_number"], "postprocess":  function([u_number]) {
          return construct_parse_tree_node('u_factor', UFACTOR_TO_UNUMBER_RULE, {u_number});
        } },
    {"name": "u_number$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "u_number$ebnf$1", "symbols": ["u_number$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "u_number$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "u_number$ebnf$2$subexpression$1$ebnf$1", "symbols": ["u_number$ebnf$2$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "u_number$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "u_number$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "u_number$ebnf$2", "symbols": ["u_number$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "u_number$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "u_number$ebnf$3$subexpression$1$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "u_number$ebnf$3$subexpression$1$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "u_number$ebnf$3$subexpression$1$ebnf$1", "symbols": ["u_number$ebnf$3$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "u_number$ebnf$3$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "u_number$ebnf$3$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "u_number$ebnf$3$subexpression$1$ebnf$2", "symbols": ["u_number$ebnf$3$subexpression$1$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "u_number$ebnf$3$subexpression$1", "symbols": [{"literal":"e"}, "u_number$ebnf$3$subexpression$1$ebnf$1", "u_number$ebnf$3$subexpression$1$ebnf$2"]},
    {"name": "u_number$ebnf$3", "symbols": ["u_number$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "u_number$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "u_number", "symbols": ["u_number$ebnf$1", "u_number$ebnf$2", "u_number$ebnf$3"], "postprocess":  function([digits, optional_decimal, optional_e], location) {
          const full_string = join(digits) + (optional_decimal !== null ? optional_decimal[0] + join(optional_decimal[1]) : '') + (optional_e !== null ? optional_e[0] + (optional_e[1] || "") + join(optional_e[2]) : "");
          return construct_parse_tree_node('u_number', '[0-9]:+', {value: Number(full_string)}, location, full_string.length);
        } },
    {"name": "u_variable$ebnf$1", "symbols": []},
    {"name": "u_variable$ebnf$1$subexpression$1", "symbols": [/[A-Za-z]/]},
    {"name": "u_variable$ebnf$1$subexpression$1", "symbols": [/[0-9]/]},
    {"name": "u_variable$ebnf$1$subexpression$1", "symbols": [{"literal":"_"}]},
    {"name": "u_variable$ebnf$1", "symbols": ["u_variable$ebnf$1", "u_variable$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "u_variable", "symbols": [/[A-Za-z]/, "u_variable$ebnf$1"], "postprocess":  function([first_char, remaining_chars], location) {
          return construct_parse_tree_node('u_variable', '[a-z]:+', {identifier: join([first_char, ...remaining_chars])}, location, remaining_chars.length + 1);
        } },
    {"name": "equal_symbol", "symbols": [{"literal":"="}], "postprocess":  function([char], location) {
          return construct_parse_tree_node('equal_symbol', '"="', {char: char}, location, char.length);
        } },
    {"name": "sign$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "sign$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "sign", "symbols": ["sign$subexpression$1"], "postprocess":  function([[sign_char]], location) {
          return construct_parse_tree_node('sign', '"+"|"-"', {char: sign_char}, location, sign_char.length);
        } },
    {"name": "left_paren", "symbols": [{"literal":"("}], "postprocess":  function([char], location) {
          return construct_parse_tree_node('left_paren', '"("', {char}, location, char.length);
        } },
    {"name": "right_paren", "symbols": [{"literal":")"}], "postprocess":  function([char], location) {
          return construct_parse_tree_node('right_paren', '")"', {char}, location, char.length);
        } },
    {"name": "scale_operator$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "scale_operator$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "scale_operator", "symbols": ["scale_operator$subexpression$1"], "postprocess":  function([[char]], location) {
          return construct_parse_tree_node('scale_operator', '("*"|"/")', {char}, location, char.length);
        } },
    {"name": "and_symbol", "symbols": [{"literal":"&"}], "postprocess":  function([char], location) {
          return construct_parse_tree_node('and_symbol', '"&"', {char}, location, char.length);
        } },
    {"name": "or_symbol", "symbols": [{"literal":"|"}], "postprocess":  function([char], location) {
          return construct_parse_tree_node('or_symbol', '"|"', {char}, location, char.length);
        } },
    {"name": "comma", "symbols": [{"literal":","}], "postprocess":  function([char], location) {
          return construct_parse_tree_node('comma', '","', {char}, location, char.length);
        } }
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
