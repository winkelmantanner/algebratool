//  A TRANSFORMATION is a manipulation of an algebraic expression.
//  Algebra Tool writes algebraic expressions as strings and models a transformation like this:
//  {
//    type: string (optional),
//    location: number,
//    num_chars: number,
//    replacement: string,
//    special: bool (optional)
//    (more attributes may appear if special===true)
//  }

// This file contains a lot of generator functions that are called for each parse tree node.
// This file also contains other stuff.


let INSTRUCTIONS_BY_TYPE = {};

function traverse_parse_tree_preorder(parse_tree_node, node_callback, initial_parent_returned = {}) {
  preorder_recursive(parse_tree_node, node_callback, initial_parent_returned);
  preorder_recursive(parse_tree_node, (node) => {}, initial_parent_returned, true);
}

function preorder_recursive(parse_tree_node, node_callback, parent_returned, deleting_mark=false) {
  if(typeof parse_tree_node === 'object' && parse_tree_node !== null && (deleting_mark ? MY_MARK_2 in parse_tree_node : !(MY_MARK_2 in parse_tree_node))) {
    if(deleting_mark) {
      delete parse_tree_node[MY_MARK_2];
    } else {
      parse_tree_node[MY_MARK_2] = true;
    }
    let returned = node_callback(parse_tree_node, parent_returned);
    for(const key in parse_tree_node) {
      preorder_recursive(parse_tree_node[key], node_callback, returned, deleting_mark);
    }
  }
}

function get_array_of_transformations(input, parse_tree_node, array_ref = []) {
  // input: a valid input string
  // parse_tree_node: any parse tree node in the parse tree of input
  // array_ref: internal use only
  // Returns an array of all possible transformations on the input.
  if(typeof parse_tree_node === 'object' && parse_tree_node !== null && !(MY_MARK in parse_tree_node)) {
    parse_tree_node[MY_MARK] = true;
    for(let key in parse_tree_node) {
      get_array_of_transformations(input, parse_tree_node[key], array_ref);
    }
    for(let generator_func of [
      generate_number_add_matches,
      generate_number_multiply_matches,
      generate_order_swap_matches,
      generate_distribute_sign_matches,
      generate_remove_parentheses_matches,
      generate_distribute_matches,
      generate_golden_rule_matches,
      generate_cancel_matches,
      generate_zero_removal_matches,
      generate_one_removal_matches,
      generate_reverse_distribute_matches,
      generate_substitution_replacements,
      generate_shorten_transformations,
      (document.getElementById('enable_identities_checkbox').checked ? generate_identity_match_transformations : function*(){})
    ]) {
      for(let match of generator_func(input, parse_tree_node)) {
        array_ref.push(match);
      }
    }
  }
  return array_ref;
}




INSTRUCTIONS_BY_TYPE[COMBINE_NUMBER_TYPE] = 
  "A string of the form [number][operator][number] can be reduced to a string of the form [number].\n"
  + "Example: 4-3 → 1\n"
  + "The numbers must not be in parentheses.  So (4)-3 or 4-(3) does not trigger the combine number transformation.  Use Remove Parentheses or Distribute Sign to remove parentheses.";

function* generate_number_add_matches(input, node) {
  // uses order
  if(typeof node === 'object'
    && node.type === 'expression'
    && node.rule === ADDITION_RULE
  ) {
    for(let index = 0; index + 1 < node.sign_u_term_pair_array.length; index++) {
      const [first_sign_u_term_pair, second_sign_u_term_pair] = node.sign_u_term_pair_array.slice(index, index + 2);
      if([first_sign_u_term_pair, second_sign_u_term_pair].every(pair => {
        return pair.u_term.rule === SCALE_RULE
          && pair.u_term.operator_u_factor_pair_array.length === 1
          && pair.u_term.operator_u_factor_pair_array[0].u_factor.rule === UFACTOR_TO_UNUMBER_RULE;
      }) ) {
        const [sign1, sign2] = [first_sign_u_term_pair, second_sign_u_term_pair].map(pair => pair.sign);
        const [first_u_factor, second_u_factor] = [first_sign_u_term_pair, second_sign_u_term_pair].map(pair => pair.u_term.operator_u_factor_pair_array[0].u_factor);
        const replacement_number = [[sign1, first_u_factor], [sign2, second_u_factor]].reduce(
          (acc, pair) => acc + (
            (pair[0] !== null && pair[0].char === '-' ? -1 : 1)
            * pair[1].u_number.value),
          0);
        const offset_for_first_sign = (sign1 === null ? 0 : sign1.char.length);
        yield {
          location: first_sign_u_term_pair.location,
          num_chars: offset_for_first_sign + second_sign_u_term_pair.u_term.location - first_sign_u_term_pair.u_term.location + second_sign_u_term_pair.u_term.num_chars,
          replacement: (replacement_number >= 0 ? "+" : "") + String(replacement_number),
          type: COMBINE_NUMBER_TYPE
        };
      }
    }
  }
}

function* generate_number_multiply_matches(input, node) {
  // uses order
  if(typeof node === 'object'
    && node.type === 'u_term'
    && node.rule === SCALE_RULE
  ) {
    for(let index = 0; index + 1 < node.operator_u_factor_pair_array.length; index++) {
      const [first_operator_u_factor_pair, second_operator_u_factor_pair] = node.operator_u_factor_pair_array.slice(index, index + 2);
      if([first_operator_u_factor_pair, second_operator_u_factor_pair].every(
        pair => pair.u_factor.rule === UFACTOR_TO_UNUMBER_RULE
      ) ) {
        const [operator1, operator2] = [first_operator_u_factor_pair, second_operator_u_factor_pair].map(pair => pair.operator);
        const [first_u_factor, second_u_factor] = [first_operator_u_factor_pair, second_operator_u_factor_pair].map(pair => pair.u_factor);
        const replacement_number = [[operator1, first_u_factor], [operator2, second_u_factor]].reduce(
          (acc, pair) => acc * 
            Math.pow(pair[1].u_number.value, (pair[0] !== null && pair[0].char === '/' ? -1 : 1)),
          1);
        const offset_for_first_operator = (operator1 === null ? 0 : operator1.char.length);
        yield {
          location: first_operator_u_factor_pair.location,
          num_chars: offset_for_first_operator + second_operator_u_factor_pair.u_factor.location - first_operator_u_factor_pair.u_factor.location + second_operator_u_factor_pair.u_factor.num_chars,
          replacement: (operator1 !== null ? "*" : "") + String(replacement_number),
          type: COMBINE_NUMBER_TYPE
        };
      }
    }
  }
}




INSTRUCTIONS_BY_TYPE[CHANGE_ORDER_TYPE] = 
  "Order can be changed in a string of the form [term]+[term], [term]-[term], [factor]*[factor], or /[factor]/[factor].\n"
  + "Example: x-y → -y+x\n"
  + "This transformation will not put 1/ in front of a term.  Instead, this transformation is not triggered by [factor]/[factor].";

function* generate_order_swap_matches(input, node) {
  // trouble maker when it comes to powertool complexity
  if(typeof node === 'object'
    && node.type === 'expression'
    && node.rule === ADDITION_RULE
  ) {
    for(let index = 0; index + 1 < node.sign_u_term_pair_array.length; index++) {
      const [first_pair, second_pair] = node.sign_u_term_pair_array.slice(index, index + 2);
      let replacement =
        get_string(input, second_pair)
        + (first_pair.sign === null ? '+' : '')
        + get_string(input, first_pair);
      const offset_for_first_sign = (first_pair.sign === null ? 0 : first_pair.sign.char.length);
      yield {
        location: first_pair.u_term.location - offset_for_first_sign,
        num_chars: offset_for_first_sign + second_pair.u_term.location - first_pair.u_term.location + second_pair.u_term.num_chars,
        replacement,
        type: CHANGE_ORDER_TYPE
      };
    }
  }

  if(typeof node === 'object'
    && node.type === 'u_term'
    && node.rule === SCALE_RULE
  ) {
    for(let index = 0; index + 1 < node.operator_u_factor_pair_array.length; index++) {
      const [first_pair, second_pair] = node.operator_u_factor_pair_array.slice(index, index + 2);
      if(!(index === 0 && second_pair.operator.char === '/')) {
        let replacement = '';
        if(index > 0) {
          replacement += second_pair.operator.char;
        }
        replacement +=
          get_string(input, second_pair.u_factor)
          + (first_pair.operator === null ? '*' : '')
          + get_string(input, first_pair);
        const offset_for_first_operator = (first_pair.operator === null ? 0 : first_pair.operator.char.length);
        yield {
          location: first_pair.u_factor.location - offset_for_first_operator,
          num_chars: offset_for_first_operator + second_pair.u_factor.location - first_pair.u_factor.location + second_pair.u_factor.num_chars,
          replacement,
          type: CHANGE_ORDER_TYPE
        };
      }
    }
  }
}

INSTRUCTIONS_BY_TYPE[REMOVE_PARENTHESIS_TYPE] = 
  REMOVE_PARENTHESIS_TYPE + " can be used to remove parentheses, which is very important for Algebra Tool.\n"
  + "Example 1: (x)/y → x/y\n"
  + "Example 2: x/(y/z) → x/y*z\n"
  + "Example 3: x-(y-z) → x-y+z";

INSTRUCTIONS_BY_TYPE[DISTRIBUTE_SIGN_TYPE] = 
  DISTRIBUTE_SIGN_TYPE + " can be used to distribute a negative sign into parentheses without removing the parentheses.\n"
  + "Example: -x/(y) → +x/(-y)";

function* generate_distribute_sign_matches(input, node) {
  // order free
  // This function actually generates correct transformations
  const node_string = get_string(input, node);
  if(typeof node === 'object'
    && node.type === 'sign_u_term_pair'
    && node.u_term.rule === SCALE_RULE
  ) {
    if(node.u_term.operator_u_factor_pair_array.length > 1) {
      // there is more than one u_factor in node.u_term
      if(node.sign !== null && node.sign.char === '-') {
        // node_string[0] === '-'
        for(let operator_u_factor_pair of node.u_term.operator_u_factor_pair_array) {
          const u_factor = operator_u_factor_pair.u_factor;
          if(u_factor.rule === UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE
            && u_factor.expression.rule === ADDITION_RULE
          ) {
            let replacement = '+' + node_string.slice(1, u_factor.location - node.location);  // replace '-' with '+'
            replacement += '(';
            for(let sign_u_term_pair of u_factor.expression.sign_u_term_pair_array) {
              const sign_char = get_char_of_multiplied_sign_objects(node.sign, sign_u_term_pair.sign);
              replacement += (sign_char === null ? '' : sign_char) // since node.sign.char === '-', sign_char !== null, so the '' case is impossible but is here for safety
                + get_string(input, sign_u_term_pair.u_term);
            }
            replacement += ')';
            replacement += node_string.slice(u_factor.location - node.location + u_factor.num_chars);
            yield {
              location: node.location,
              num_chars: node.num_chars,
              replacement,
              type: DISTRIBUTE_SIGN_TYPE
            };
          }
        }
      }
    }
  }
}

function* generate_remove_parentheses_matches(input, node) {
  // order free
  // This function actually generates correct transformations
  if(typeof node === 'object'
    && node.type === 'sign_u_term_pair'
    && node.u_term.rule === SCALE_RULE
  ) {
    if(node.u_term.operator_u_factor_pair_array.length > 1) {
      // there is more than one u_factor in node.u_term
      for(let operator_u_factor_pair of node.u_term.operator_u_factor_pair_array) {
        const u_factor = operator_u_factor_pair.u_factor;
        if(u_factor.rule === UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE
          && u_factor.expression.rule === ADDITION_RULE
          && u_factor.expression.sign_u_term_pair_array.length === 1
        ) {
          // there is only one term in the u_factor.expression
          // distribute the operator_u_factor_pair.operator into the parentheses, removing the parentheses
          const resulting_sign_char = get_char_of_multiplied_sign_objects(
            node.sign,
            u_factor.expression.sign_u_term_pair_array[0].sign);
          let replacement = resulting_sign_char || '';
          replacement += input.slice(node.u_term.location, u_factor.location - (operator_u_factor_pair.operator === null ? 0 : 1));
          replacement += u_factor.expression.sign_u_term_pair_array[0].u_term.operator_u_factor_pair_array.reduce(
            (s, pair) =>  s
              + (get_char_of_multiplied_operator_objects(operator_u_factor_pair.operator, pair.operator) || '')
              + get_string(input, pair.u_factor),
            ""
          );
          replacement += input.slice(u_factor.location + u_factor.num_chars, node.location + node.num_chars);
          yield {
            location: node.location,
            num_chars: node.num_chars,
            replacement,
            type: REMOVE_PARENTHESIS_TYPE
          };
        }
      }
    } else { // node.u_term.operator_u_factor_pair_array.length === 1
      const the_u_factor = node.u_term.operator_u_factor_pair_array[0].u_factor;
      if(the_u_factor.rule === UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE) {
        // distribute node.sign into the_u_factor, removing the parentheses
        let replacement = '';
        const pair_array = the_u_factor.expression.sign_u_term_pair_array;
        for(let pair of pair_array) {
          const sign_char = get_char_of_multiplied_sign_objects(node.sign, pair.sign);
          replacement += (sign_char === null ? '' : sign_char)
            + get_string(input, pair.u_term);
        }
        yield {
          location: node.location,
          num_chars: node.num_chars,
          replacement,
          type: REMOVE_PARENTHESIS_TYPE
        };
      }
    }
  }
}


INSTRUCTIONS_BY_TYPE[DISTRIBUTE_TYPE] = 
  "A string of the form ([term]+[term]+...)*[factor] or ([term]+[term]+...)/[factor] can be transformed to ([term]*[factor]+[term]*[factor]+...) or ([term]/[factor]+[term]/[factor]+...).\n"
  + "The parentheses into which the distribution occurs will be automatically removed if applicable.\n"
  + "Example 1: (x+y)*z → x*z+y*z\n"
  + "Example 2: w*(x+y)/z → w*(x/z+y/z)";

function get_distribute_replacement_if_applicable(input, first_pair, second_pair) {
  // the idea is that the order of the pairs doesn't matter
  if(
    (second_pair.operator === null || second_pair.operator.char === '*') // second_pair.operator.char !== '/' because you can't distribute into a denominator
    && second_pair.u_factor.rule === UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE
    && second_pair.u_factor.expression.rule === ADDITION_RULE
    && second_pair.u_factor.expression.sign_u_term_pair_array.length >= 2
  ) {
    let replacement = "";
    if(second_pair.operator !== null && first_pair.operator !== null) {
      replacement += second_pair.operator.char;
    }
    replacement += '(';
    for(let sign_u_term_pair of second_pair.u_factor.expression.sign_u_term_pair_array) {
      replacement += get_string(input, sign_u_term_pair);
      replacement += (first_pair.operator === null ? '*' : first_pair.operator.char);
      replacement += get_string(input, first_pair.u_factor);
    }
    replacement += ')';
    return replacement;
  }
  return null;
}

function* generate_distribute_matches(input, node) {
  // uses order
  if(node.type === 'u_term'
    && node.rule === SCALE_RULE
  ) {
    for(let index = 0; index + 1 < node.operator_u_factor_pair_array.length; index++) {
      const [first_pair, second_pair] = node.operator_u_factor_pair_array.slice(index, index + 2);
      for(let pair_pair of [[first_pair, second_pair], [second_pair, first_pair]]) {
        const replacement = get_distribute_replacement_if_applicable(input, pair_pair[0], pair_pair[1]);
        if(replacement !== null) {
          const transformation_with_no_parens_removed = {
            location: first_pair.location,
            num_chars: second_pair.location - first_pair.location + second_pair.num_chars,
            replacement,
            type: DISTRIBUTE_TYPE
          };
          yield get_transformation_after_parens_are_removed(input, transformation_with_no_parens_removed, [first_pair.location]);
        }
      }
    }
  }
}

INSTRUCTIONS_BY_TYPE[CANCEL_TYPE] = 
  "A string of the form s/s or s-s can be reduced to the identity number (1 or 0), where s is a string.\n"
  + "Example 1: x*y-x*y → 0\n"
  + "Example 2: (x-y)/(x-y) → 1\n"
  + "The cancelled strings must be exactly the same.\n"
  + "So (+x-y)/(x-y) will not trigger the cancel operation.  Use Change Order twice to make the + sign appear.\n"
  + "Likewise, (x)-((x)) does not trigger the cancel transformation.\n"
  + "As of me writing this, Cancel will only be triggered by cancellable expressions if they next to each other.  You might have to use Change Order to acheive this.";

function* generate_cancel_matches(input, node) {
  // uses order
  for(let [cancelled_type, delimiting_type, positive_char, negative_char, parent_type,  rule,          pair_array_name,                equivalent, get_char_of_multiplied_delimiter_objects] of [
          ['u_term',       'sign',          '+',           '-',           'expression', ADDITION_RULE, "sign_u_term_pair_array",       0,          get_char_of_multiplied_sign_objects],
          ['u_factor',     'operator',      '*',           '/',           'u_term',     SCALE_RULE,    "operator_u_factor_pair_array", 1,          get_char_of_multiplied_operator_objects]
  ]) {
    if(node.type === parent_type && node.rule === rule) {
      let pair_array = node[pair_array_name];
      for(let index = 0; index + 1 < pair_array.length; index++) {
        let [first_pair, second_pair] = pair_array.slice(index, index + 2);
        if(get_string(input, first_pair[cancelled_type]) === get_string(input, second_pair[cancelled_type])
          && get_char_of_multiplied_delimiter_objects(first_pair[delimiting_type], second_pair[delimiting_type])
            === negative_char
        ) {
          yield {
            location: first_pair.location,
            num_chars: second_pair.num_chars + second_pair.location - first_pair.location,
            replacement: (index === 0 && cancelled_type === 'u_factor' ? '' : positive_char)
              + String(equivalent),
            type: CANCEL_TYPE
          };
        }
      }
    }
  }
}

INSTRUCTIONS_BY_TYPE[REMOVE_ZERO_TYPE] = 
  "0 as a term can be removed.\n"
  + "Example: +0-x → -x";

function* generate_zero_removal_matches(input, node) {
  // does not use order
  if(node.type === 'expression' && node.rule === ADDITION_RULE) {
    let pair_array = node.sign_u_term_pair_array;
    if(pair_array.length > 1) {
      for(let pair of pair_array) {
        if(pair.u_term.rule === SCALE_RULE
          && pair.u_term.operator_u_factor_pair_array.length === 1
          && pair.u_term.operator_u_factor_pair_array[0].u_factor.rule === UFACTOR_TO_UNUMBER_RULE
          && pair.u_term.operator_u_factor_pair_array[0].u_factor.u_number.value === 0
        ) {
          yield {
            location: pair.location,
            num_chars: pair.num_chars,
            replacement: '',
            type: REMOVE_ZERO_TYPE
          };
        }
      }
    }
  }
}

INSTRUCTIONS_BY_TYPE[REMOVE_ONE_TYPE] = 
  "1 as a factor can be removed.\n"
  + "Example: x/1 → x";

function* generate_one_removal_matches(input, node) {
  // does not use order
  if(node.type === 'u_term' && node.rule === SCALE_RULE) {
    let pair_array = node.operator_u_factor_pair_array;
    if(pair_array.length > 1) {
      for(let index = 0; index < pair_array.length; index++) {
        let pair = pair_array[index];
        if(pair.u_factor.rule === UFACTOR_TO_UNUMBER_RULE
          && pair.u_factor.u_number.value === 1
          && !(index === 0 && pair_array[1].operator.char === '/')
        ) {
          let offset_for_next_operator = (index + 1 < pair_array.length ? 1 : 0);
          yield {
            location: pair.location,
            num_chars: pair.num_chars + offset_for_next_operator,
            replacement: (offset_for_next_operator === 1 && index > 0 ? pair_array[index + 1].operator.char : ''),
            type: REMOVE_ONE_TYPE
          };
        }
      }
    }
  }
}

INSTRUCTIONS_BY_TYPE[GOLDEN_RULE_OF_ALGEBRA_TYPE] = 
  "Any mathematical operation can be performed on one side of an equation so long as the identical operation is performed on the other side of the equation. <a href='http://hyperphysics.phy-astr.gsu.edu/hbase/alg2.html#ag'>[source]</a>\n"
  + "Select an equation. Then, use the Operator box to specify the operation.  Use the Expression box to specify the right operand.\n"
  + "Algebra Tool wraps the previous expression and the right operand in parentheses only if necessary.\n"
  + "<strong>Warning:</strong>If you divide by something, make sure that it is not 0.  Algebra tool cannot check that for you.";

function* generate_golden_rule_matches(input, node) {
  // does not use order
  if(node.type === 'equality'
    && node.rule === EQUALITY_RULE
  ) {
    yield {
      type: GOLDEN_RULE_OF_ALGEBRA_TYPE,
      special: true,
      equality: node
    };
  }
}

INSTRUCTIONS_BY_TYPE[REVERSE_DISTRIBUTE_TYPE] = 
  "Reverse distribution, also called factorization, reverses the distribute transformation.\n"
  + "Example 1: x*y+w*y → (x+w)*y\n"
  + "Example 2: x/(y+z)+w/(y+z) → (x+w)/(y+z)\n"
  + "The factored out expressions must look exactly the same.  So x/(y)+w/(+y) does not trigger the factor transformation.";

function* generate_reverse_distribute_matches(input, node) {
  // uses order
  if(node.type === 'expression'
    && node.rule === ADDITION_RULE
    && node.sign_u_term_pair_array.length >= 2
  ) {
    for(let index = 0; index + 1 < node.sign_u_term_pair_array.length; index++) {
      if([0, 1].every(n => node.sign_u_term_pair_array[index + n].u_term.rule === SCALE_RULE)) {
        const [first_array, second_array] = [0, 1].map(n => node.sign_u_term_pair_array[index + n].u_term.operator_u_factor_pair_array);
        for(let first_index = 0; first_index < first_array.length; first_index++) {
          for(let second_index = 0; second_index < second_array.length; second_index++) {
            let first_operator_u_factor_pair = first_array[first_index];
            let second_operator_u_factor_pair = second_array[second_index];
            function ultimateness(array, index_inner) {
              let following_operator_replacement = '';
              let following_operator_offset = 0;
              if(index_inner === 0) {
                if(index_inner + 1 < array.length) {
                  following_operator_offset = array[index_inner + 1].operator.char.length;
                  following_operator_replacement = (array[index_inner + 1].operator.char === '/' ? '1/' : '');
                } else {
                  following_operator_replacement = '1';
                }
              }
              return [following_operator_replacement, following_operator_offset];
            }
            let [first_following_operator_replacement, first_following_operator_offset] = ultimateness(first_array, first_index);
            let [second_following_operator_replacement, second_following_operator_offset] = ultimateness(second_array, second_index);
            if(get_string(input, first_operator_u_factor_pair.u_factor) === get_string(input, second_operator_u_factor_pair.u_factor)
              && true === {'*':true, null:true}[get_char_of_multiplied_operator_objects(first_operator_u_factor_pair.operator, second_operator_u_factor_pair.operator)]
              && get_string(input, first_operator_u_factor_pair) !== "1"
            ) {
              yield {
                location: node.sign_u_term_pair_array[index].location,
                num_chars: node.sign_u_term_pair_array[index + 1].location - node.sign_u_term_pair_array[index].location + node.sign_u_term_pair_array[index + 1].num_chars,
                replacement:
                  (index === 0 ? '' : '+')
                  + "("
                  + input.slice(node.sign_u_term_pair_array[index].location, first_operator_u_factor_pair.location)
                  + first_following_operator_replacement
                  + input.slice(first_operator_u_factor_pair.location + first_operator_u_factor_pair.num_chars + first_following_operator_offset, second_operator_u_factor_pair.location)
                  + second_following_operator_replacement
                  + input.slice(second_operator_u_factor_pair.location + second_operator_u_factor_pair.num_chars + second_following_operator_offset, node.sign_u_term_pair_array[index + 1].location + node.sign_u_term_pair_array[index + 1].num_chars)
                  + ")"
                  + (first_operator_u_factor_pair.operator === null ? '*' : first_operator_u_factor_pair.operator.char)
                  + get_string(input, first_operator_u_factor_pair.u_factor),
                type: REVERSE_DISTRIBUTE_TYPE
              }
            }
          }
        }
      }
    }
  }
}

INSTRUCTIONS_BY_TYPE[SUBSTITUTE_TYPE] = 
  "An equation of the form x=expression allows expression to be substituted for x in any other equation.\n"
  + "Example: +x=y-3&7*x-9*y=4 → +x=y-3&7*(y-3)-9*y=4\n"
  + "A + sign does not prevent substitution from being triggered.  Substitution is not effected by order.";

function* generate_substitution_replacements(input, node) {
  // does not use order
  if(node.type === 'b_term'
    && node.rule === CONJUNCTION_RULE
  ) {
    for(let b_factor of node.b_factor_array) {
      if(b_factor.rule === BFACTOR_TO_EQUALITY_RULE) {
        for(let pair of generate_identifiers_expression_pairs_for_which_the_equality_is_solved(b_factor.equality)) {
          for(let target_b_factor of node.b_factor_array) {
            if(target_b_factor !== b_factor
              && target_b_factor.rule === BFACTOR_TO_EQUALITY_RULE
              && get_string(input, target_b_factor.equality).search(new RegExp(pair.identifier, 'g')) >= 0
            ) {
              let location_array = [];
              traverse_parse_tree_preorder(target_b_factor, (node) => {
                if(node.type === 'u_factor' && node.rule === UFACTOR_TO_UVARIABLE_RULE && node.u_variable.identifier === pair.identifier) {
                  location_array.push(node.location);
                }
              });
              if(location_array.length > 0) {
                const equality = target_b_factor.equality;
                let replacement = '';
                let prev_end_loc = equality.location;
                let resulting_open_paren_location_array = [];
                location_array.forEach((loc) => {
                  replacement += input.slice(prev_end_loc, loc);
                  resulting_open_paren_location_array.push(replacement.length + equality.location);
                  replacement += '(' + get_string(input, pair.expression) + ')';
                  prev_end_loc = loc + pair.identifier.length;
                });
                replacement += input.slice(prev_end_loc, equality.location + equality.num_chars);
                const transformation_with_no_parens_removed = {
                  location: equality.location,
                  num_chars: equality.num_chars,
                  replacement,
                  type: SUBSTITUTE_TYPE
                };
                yield get_transformation_after_parens_are_removed(input, transformation_with_no_parens_removed, resulting_open_paren_location_array);
              }
            }
          }
        }
      }
    }
  }
}



INSTRUCTIONS_BY_TYPE[SHORTEN_TYPE] = 
  "The shorten tranformation uses the power of your computer to compute a shorter way to write an expression.\n"
  + "It is not good at pressing the right buttons, but it will try out " + String(SHORTEN_SEARCH_LIMIT) + " button presses in a few seconds and give you the shortest equivalent expression it could find.";

function* generate_shorten_transformations(input, node) {
  if(node.type === 'equality'
    && node.rule === EQUALITY_RULE
  ) {
    for(let expression of node.expression_array) {
      yield {
        special: true,
        location: expression.location,
        num_chars: expression.num_chars,
        type: SHORTEN_TYPE,
        expression
      };
    }
  }
}

INSTRUCTIONS_BY_TYPE[IDENTITIES_TYPE] = 
  "Identities allow a lot of different rules by making rules into data rather than code.\n"
  + "Unfortunately, identities don't work very well, so they are disabled by default.\n"
  + "You can make your own identities.\n"
  + "An identity consists of two sides.\n"
  + "When one side is matched, variable names will be taken from it and substituted in the other side.\n"
  + "If you make changes to the identity set, they will be saved as cookies in your web browser.";


function* generate_identity_match_transformations(input, node) {
  for(let identity_key in identities) {
    let {side_strings, side_objects} = get_sides_from_identity_with_given_key(identity_key);
    for(let side_index = 0; side_index < side_strings.length; side_index++) {
      // let current_side_string = side_strings[side_index];
      let other_side_string = side_strings[1 - side_index];
      let current_side_object = side_objects[side_index];
      let other_side_object = side_objects[1 - side_index];
      let matches = {};
      if(match_identity(input, node, current_side_object, matches)) {
        const other_side_replacable_data = get_all_variables_and_nearest_sign_u_term_pair(other_side_object);
        if(Object.keys(other_side_replacable_data).every(identifier => identifier in matches)) {
          let transformation_array = [];
          for(let identity_identifier in other_side_replacable_data) {
            for(let replacement_datum of other_side_replacable_data[identity_identifier]) {
              const {location, num_chars} = replacement_datum.u_variable;
              transformation_array.push(
                object_spread(
                  {location, num_chars},
                  {replacement: matches[identity_identifier].corresponding_string}
                )
              );
            }
          }
          yield {
            special: true,
            location: node.location,
            num_chars: node.num_chars,
            replacement: "(" + get_text_after_multiple_transformations(other_side_string, transformation_array) + ")",
            type: IDENTITIES_TYPE,
            identity_name: identities[identity_key].name
          }
        } else {
          yield {
            special: true,
            message: "One side of the identity matched, but a button could not be generated because the other side contained a variable that the matched side did not contain, so Algebra Tool didn't know what to substitute for the variable on the other side.",
            type: IDENTITIES_TYPE,
            identity_name: identities[identity_key].name
          }
        }
      }
    }
  }
}
