
# u_ means unsigned

# If you add to this, you might want to add to the hash function also

main -> statement {% ([statement]) => construct_parse_tree_node('main', 'statement', {statement}) %}

statement -> (b_term or_symbol):* b_term {% ([b_term_or_symbol_pair_array, final_b_term]) => {
  let b_term_array = b_term_or_symbol_pair_array.map(pair => pair[0]);
  b_term_array.push(final_b_term);
  return construct_parse_tree_node('statement', DISJUNCTION_RULE, {b_term_array});
} %}

b_term -> (b_factor (and_symbol | semicolon)):* b_factor {% ([pair_array, final_b_factor]) => {
  let b_factor_array = pair_array.map(pair => pair[0]);
  b_factor_array.push(final_b_factor);
  return construct_parse_tree_node('b_term', CONJUNCTION_RULE, {b_factor_array});
} %}

b_factor -> left_paren statement right_paren {% function([left_paren, statement, right_paren], location) {
  return construct_parse_tree_node('b_factor', BFACTOR_TO_PARENTHESISED_STATEMENT_RULE, {left_paren, statement, right_paren});
} %}
b_factor -> equality {% function([equality], location) {
  return construct_parse_tree_node('b_factor', BFACTOR_TO_EQUALITY_RULE, {equality});
} %}

equality -> (expression equal_symbol):+ expression {% function(data) {
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
} %}

expression -> sign:? u_term (sign u_term):* {% function([first_sign, first_u_term, sign_u_term_pairs], location) {
  // initialize sign_u_term_pair_array with first pair
  let sign_u_term_pair_array = [construct_parse_tree_node('sign_u_term_pair', '', {sign: first_sign, u_term: first_u_term}, location, (first_sign !== null ? first_sign.num_chars : 0) + first_u_term.num_chars)];
  // add pairs to sign_u_term_pair_array, while tallying num_chars
  for(let pair of sign_u_term_pairs) {
    sign_u_term_pair_array.push(construct_parse_tree_node('sign_u_term_pair', '', {sign: pair[0], u_term: pair[1]}, pair[0].location, pair[0].num_chars + pair[1].num_chars));
  }
  return construct_parse_tree_node('expression', ADDITION_RULE, {sign_u_term_pair_array});
} %}

func -> u_variable left_paren expression (comma expression):* right_paren {% function([u_variable, left_paren, first_expression, comma_expression_pair_array, right_paren]) {
  return construct_parse_tree_node('func', 'func_rule', {
    u_variable,
    expression_array: [first_expression, ...comma_expression_pair_array.map(pair => pair[1])],
    comma_array: comma_expression_pair_array.map(pair => pair[0]),
    left_paren,
    right_paren
  });
} %}

u_term -> u_factor (scale_operator u_factor):* {% function([first_u_factor, pair_array]) {
  let operator_u_factor_pair_array = [
    construct_parse_tree_node('operator_u_factor_pair', '', {operator: null, u_factor: first_u_factor})
  ];
  for(let pair of pair_array) {
    operator_u_factor_pair_array.push(construct_parse_tree_node('operator_u_factor_pair', '', {operator: pair[0], u_factor: pair[1]}));
  }
  return construct_parse_tree_node('u_term', SCALE_RULE, {operator_u_factor_pair_array});
} %}

u_factor -> left_paren expression right_paren {% function([left_paren, expression, right_paren], location) {
  return construct_parse_tree_node('u_factor', UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE, {left_paren, expression, right_paren});
} %}
u_factor -> func {% function([func]) {
  return construct_parse_tree_node('u_factor', UFACTOR_TO_FUNC_RULE, {func});
} %}

u_factor -> u_variable {% function([u_variable]) {
  return construct_parse_tree_node('u_factor', UFACTOR_TO_UVARIABLE_RULE, {u_variable});
} %}
u_factor -> u_number {% function([u_number]) {
  return construct_parse_tree_node('u_factor', UFACTOR_TO_UNUMBER_RULE, {u_number});
} %}

# All rules above this comment may not have terminals on the RHS.
# All rules below this comment may not have nonterminals on the RHS.
# The return value of all postprocessor functions below this
#   comment must have the location and num_chars attributes.
#
# Those three requirements are necessary to accurately get the
#   location and num_chars of parse tree nodes.

u_number -> [0-9]:+ ("." [0-9]:+):? ("e" ("+"|"-"):? [0-9]:+):? {% function([digits, optional_decimal, optional_e], location) {
  const full_string = join(digits) + (optional_decimal !== null ? optional_decimal[0] + join(optional_decimal[1]) : '') + (optional_e !== null ? optional_e[0] + (optional_e[1] || "") + join(optional_e[2]) : "");
  return construct_parse_tree_node('u_number', '[0-9]:+', {value: Number(full_string)}, location, full_string.length);
} %}
u_variable -> [A-Za-z] ([A-Za-z]|[0-9]|"_"):* {% function([first_char, remaining_chars], location) {
  return construct_parse_tree_node('u_variable', '[a-z]:+', {identifier: join([first_char, ...remaining_chars])}, location, remaining_chars.length + 1);
} %}
equal_symbol -> "=" {% function([char], location) {
  return construct_parse_tree_node('equal_symbol', '"="', {char: char}, location, char.length);
} %}
sign -> ("+"|"-") {% function([[sign_char]], location) {
  return construct_parse_tree_node('sign', '"+"|"-"', {char: sign_char}, location, sign_char.length);
} %}
left_paren -> "(" {% function([char], location) {
  return construct_parse_tree_node('left_paren', '"("', {char}, location, char.length);
} %}
right_paren -> ")" {% function([char], location) {
  return construct_parse_tree_node('right_paren', '")"', {char}, location, char.length);
} %}

scale_operator -> ("*"|"/") {% function([[char]], location) {
  return construct_parse_tree_node('scale_operator', '("*"|"/")', {char}, location, char.length);
} %}

semicolon -> ";" {% function([char], location) {
  return construct_parse_tree_node('semicolon', '";"', {char}, location, char.length);
} %}
and_symbol -> "&" {% function([char], location) {
  return construct_parse_tree_node('and_symbol', '"&"', {char}, location, char.length);
} %}
or_symbol -> "|" {% function([char], location) {
  return construct_parse_tree_node('or_symbol', '"|"', {char}, location, char.length);
} %}

comma -> "," {% function([char], location) {
  return construct_parse_tree_node('comma', '","', {char}, location, char.length);
} %}