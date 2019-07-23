
const LOCATION = 'location';
const NUM_CHARS = 'num_chars';

const HISTORY_ENTRY_DIV_PREFIX = 'history_entry_div_';



function object_spread(object1, object2) {
  // object2 overrides object1
  let result = {};
  for(let key in object1) {
    result[key] = object1[key];
  }
  for(let key in object2) {
    result[key] = object2[key];
  }
  return result;
}

function determine_location(parse_tree_node, already_processed=[]) {
  // returns null if the location cannot be determined
  if(typeof parse_tree_node === 'object' && parse_tree_node !== null) {
    if(LOCATION in parse_tree_node) {
      return parse_tree_node.location;
    } else {
      if(parse_tree_node in already_processed) {
        throw "recursive parse tree!";
      }
      already_processed.push(parse_tree_node);
      let min_location = Infinity;
      for(let attribute_key in parse_tree_node) {
        const child_location = determine_location(parse_tree_node[attribute_key], already_processed);
        if(child_location !== null && child_location < min_location) {
          min_location = child_location;
        }
      }
      if(!isFinite(min_location)) {
        min_location = null;
      }
      return min_location;
    }
  }
  return null;
}

function determine_num_chars(parse_tree_node, already_processed=[]) {
  // returns null if the num_chars cannot be determined
  let num_chars = 0;
  if(typeof parse_tree_node === 'object' && parse_tree_node !== null) {
    if(NUM_CHARS in parse_tree_node) {
      num_chars = parse_tree_node.num_chars;
    } else {
      if(parse_tree_node in already_processed) {
        throw "recursive parse tree!";
      }
      already_processed.push(parse_tree_node);
      for(let attribute_key in parse_tree_node) {
        if(Array.isArray(parse_tree_node) && typeof parse_tree_node[attribute_key] === 'string') {
          num_chars += parse_tree_node[attribute_key].length;
        } else {
          const child_num_chars = determine_num_chars(parse_tree_node[attribute_key], already_processed);
          if(child_num_chars !== null) {
            num_chars += child_num_chars;
          }
        }
      }
    }
  }
  return num_chars;
}

function construct_parse_tree_node(type, rule, attributes, location = null, num_chars = null) {
  /*
  type: String
  rule: String
  attributes: object.  Includes all remaining information about the node and its children.
  location: should be passed for leaf nodes.  Otherwise, this will be determined from the attributes.  If this is unable to be determined, it will be null in the resulting object.
  num_chars: should be passed for leaf nodes.  Otherwise, this will be determined from the attributes.  If this is unable to be determined, it will be null in the resulting object.
  */
  // if(num_chars !== null) {
  //   console.log(num_chars);
  // }
  let node = object_spread({type, rule}, attributes);
  node.location = (location === null ? determine_location(node) : location);
  node.num_chars = (num_chars === null ? determine_num_chars(node) : num_chars);
  return node;
}

function join(char_array) {
  // let s = '';
  // for(let k = 0; k < char_array.length; k++) {
  //   s += char_array[k];
  // }
  return char_array.join('');
}

function get_text_after_transformation(input, transformation) {
  return input.slice(0, transformation.location) + transformation.replacement + input.slice(transformation.location + transformation.num_chars);
}
function get_text_after_multiple_transformations(input, transformation_array) {
  // modifies transformation_array
  transformation_array.sort((transf1, transf2) => {
    if(transf1.location < transf2.location) {
      return -1;
    } else if(transf1.location > transf2.location) {
      return 1;
    } else {
      return 0;
    }
  });
  let end_of_prev_transf = 0;
  let result = transformation_array.reduce((accumulator, transformation) => {
    const returnable = accumulator + input.slice(end_of_prev_transf, transformation.location) + transformation.replacement;
    end_of_prev_transf = transformation.location + transformation.num_chars;
    return returnable;
  }, '');
  if(transformation_array.length > 0) {
    const last_transf = transformation_array[transformation_array.length - 1];
    result += input.slice(last_transf.location + last_transf.num_chars);
  } else {
    return input;
  }
  return result;
}

let transformations_by_id = {};
let current_transformation_id = 0;
let inputs_by_id = {};
let current_input_id = 0;
function clear_transformations() {
  transformations_by_id = {};
  current_transformation_id = 0;
  inputs_by_id = {};
  current_input_id = 0;
  document.getElementById("transformation_container").innerHTML = "";
}
function transformation_on_click(input_id, transformation_id) {
  transformation_on_click_given_input_and_transformation(inputs_by_id[input_id], transformations_by_id[transformation_id]);
}
function transformation_on_click_given_input_and_transformation(input, transformation) {
  // history.push(object_spread({string_before: input}, transformation));
  document.getElementById('input').value = 
    get_text_after_transformation(input, transformation);
  history_push(input, transformation);
  clear_transformations();
  parse(get_text_after_transformation(input, transformation));
}
function toggleInfo(element, type) {
  let info_element = document.getElementById(element.dataset.content_id);
  if(info_element.innerHTML === '') {
    info_element.innerHTML = INSTRUCTIONS_BY_TYPE[type];
  } else {
    info_element.innerHTML = '';
  }
}
function get_standard_header(text) {
  return "<h5>" + text + "</h5>";
}
function get_transformation_header_html(type) {
  let r = Math.random();
  return "<div>"
    + "<div style='float: left;'>" + get_standard_header(type) + "</div>"
    + (type in INSTRUCTIONS_BY_TYPE 
      ? "<div style='float: left;'><button data-content_id='" + String(r) + "' onClick='toggleInfo(this, \"" + type + "\")'>Info</button></div></div>"
        + "<div style='white-space: pre-wrap; float: top;' id='" + String(r) + "'></div>"
      : "</div>");
}
function get_red_text_span_html(text) {
  return "<span style='color: red;'>"
    + text
    + "</span>";
}
function get_string_after_transformation_html(input, transformation) {
  return input.slice(0, transformation.location)
    + get_red_text_span_html(transformation.replacement)
    + input.slice(transformation.location + transformation.num_chars);
}
function get_string_before_transformation_html(input, transformation) {
  return input.slice(0, transformation.location)
    + get_red_text_span_html(get_string(input, transformation))
    + input.slice(transformation.location + transformation.num_chars);
}
function get_button_html_of_transformation(input, transformation, header_in_button=false) {
  current_transformation_id++;
  transformations_by_id[current_transformation_id] = transformation;
  current_input_id++;
  inputs_by_id[current_input_id] = input;
  return "<button style='padding: 5px;' onclick='transformation_on_click(" + String(current_input_id) + ", " + String(current_transformation_id) + ")'>"
    + "<div>"
    + (header_in_button ? get_transformation_header_html(transformation.type) : "")
    + "<div float='top'>"
    + get_string_before_transformation_html(input, transformation)
    + "</div>"
    + "<div float='bottom'>"
    + get_string_after_transformation_html(input, transformation)
    + "</div></div>"
    + "</button>";
}
function get_html_of_transformation(input, transformation) {
  return "<tr><td>"
    + get_button_html_of_transformation(input, transformation)
    + "</td></tr>";
}
function get_char_of_multiplied_sign_objects(sign_object_1, sign_object_2) {
  if(sign_object_1 === null && sign_object_2 === null) return null;
  if(sign_object_1 === null) return sign_object_2.char;
  if(sign_object_2 === null) return sign_object_1.char;
  return get_char_of_multiplied_sign_chars(sign_object_1.char, sign_object_2.char);
}
function get_char_of_multiplied_sign_chars(sign_char_1, sign_char_2) {
  return {
    '++': '+',
    '+-': '-',
    '-+': '-',
    '--': '+'
  }[sign_char_1 + sign_char_2];
}
function get_char_of_multiplied_operator_objects(operator_object_1, operator_object_2) {
  if(operator_object_1 === null && operator_object_2 === null) return null;
  if(operator_object_1 === null) return operator_object_2.char;
  if(operator_object_2 === null) return operator_object_1.char;
  return {
    '**': '*',
    '*/': '/',
    '/*': '/',
    '//': '*'
  }[operator_object_1.char + operator_object_2.char];
}
function get_string(input, parse_tree_node) {
  return input.slice(parse_tree_node.location, parse_tree_node.location + parse_tree_node.num_chars);
}

function* generate_identifiers_expression_pairs_for_which_the_equality_is_solved(equality_object) {
  /*
    yields {identifier: string, expression: object} pairs
  */
  if(equality_object.type === 'equality') {
    if(equality_object.rule === EQUALITY_RULE) {
      for(let expression of equality_object.expression_array) {
        if(expression.rule === ADDITION_RULE
          && expression.sign_u_term_pair_array.length === 1
          && (expression.sign_u_term_pair_array[0].sign === null
            || expression.sign_u_term_pair_array[0].sign.char === '+')
          && expression.sign_u_term_pair_array[0].u_term.rule === SCALE_RULE
          && expression.sign_u_term_pair_array[0].u_term.operator_u_factor_pair_array.length === 1
          && expression.sign_u_term_pair_array[0].u_term.operator_u_factor_pair_array[0].u_factor.rule === UFACTOR_TO_UVARIABLE_RULE
        ) {
          for(let other_expression of equality_object.expression_array) {
            if(other_expression !== expression) {
              yield {
                identifier: expression.sign_u_term_pair_array[0].u_term.operator_u_factor_pair_array[0].u_factor.u_variable.identifier,
                expression: other_expression
              };
            }
          }
        }
      }
    }
  } else {
    throw "generate_identifiers_expression_pairs_for_which_the_equality_is_solved was passed something that was not an equality";
  }
}




function get_golden_rule_radio_button_and_label(input, value, equality) {
  const id = 'golden_rule_choice_' + String(value);
  return $('<div float="left"></div>').append($(
    $('<input type="radio" id="' + id + '" name="golden_rule_equation_selection" value="' + String(value) + '">')
    .change(function(){
      $('#' + GOLDEN_RULE_ACTION_DIV_CONTAINER_ID).empty();
      $('#' + GOLDEN_RULE_ACTION_DIV_CONTAINER_ID).append(
        get_golden_rule_action_div(input, equality)
      );
    })
  )).append($(
    ' <label for="' + id + '">'
    + get_string(input, equality)
    + '</label>'
  ));
}

function get_shorten_radio_button_and_label(input, value, expression) {
  const id = 'shorten_choice_' + String(value);
  return $('<div float="left"></div>').append($(
    $('<input type="radio" id="' + id + '" name="shorten_expression_selection" value="' + String(value) + '">')
    .change(function(){
      $('#' + SHORTEN_ACTION_DIV_CONTAINER_ID).empty();
      $('#' + SHORTEN_ACTION_DIV_CONTAINER_ID).append(
        get_shorten_action_div(input, expression)
      );
    })
  )).append($(
    ' <label for="' + id + '">'
    + get_string_before_transformation_html(input, expression)
    + '</label>'
  ));
}

function multislice(string, location_pair_array) {
  // location_pair_array is an array of slice-style location pairs
  return location_pair_array.reduce((acc, next_pair) => {
    return acc + string.slice(...next_pair);
  }, "");
}

function get_transformation_to_remove_parens(string_with_parens, nearest_sign_u_term_pair, u_factor_that_goes_to_parenthesised_expression) {
  // returns a transformation if the parens can be deleted from the string
  // otherwise returns null
  if(u_factor_that_goes_to_parenthesised_expression.type !== 'u_factor') {
    throw 'get_transformation_to_remove_parens was passed a u_factor_that_goes_to_parenthesised_expression that was not a u_factor';
  }
  let found = false;
  const node = u_factor_that_goes_to_parenthesised_expression; // just cause that variable name is so long
  for(let transf_inner of generate_sign_distribute_matches(string_with_parens, nearest_sign_u_term_pair)) {
    if(get_text_after_transformation(string_with_parens, transf_inner) === multislice(string_with_parens, [[0, node.location], [node.location + 1, node.location + node.num_chars - 1], [node.location + node.num_chars]])) {
      found = true;
    }
  }
  if(found) {
    return {
      location: node.location,
      num_chars: node.num_chars,
      replacement: string_with_parens.slice(node.location + 1, node.location + node.num_chars - 1)
    };
  } else {
    return null;
  }
}

function get_golden_rule_transformation(input, equality_node, operator_string, expression_string) {
  let replacement = '';
  let open_paren_location_array = []; // location in replacement
  for(let index = 0; index < equality_node.expression_array.length; index++) {
    if(index >= 1) {
      replacement += '=';
    }

    open_paren_location_array.push(replacement.length);
    replacement += "(" + get_string(input, equality_node.expression_array[index]) + ")" + operator_string;

    open_paren_location_array.push(replacement.length);
    replacement += "(" + expression_string + ")";
  }

  const transformation_with_no_parens_removed = {
    location: equality_node.location,
    num_chars: equality_node.num_chars,
    replacement,
    type: GOLDEN_RULE_OF_ALGEBRA_TYPE
  };
  const result_with_no_parens_removed = get_text_after_transformation(input, transformation_with_no_parens_removed);

  let paren_removal_parser = new nearley.Parser(COMPILED_GRAMMAR);
  paren_removal_parser.feed(result_with_no_parens_removed);
  let paren_removal_transformations = []; // the location for these is configured for result_with_no_parens_removed, but they are mapped through the shift of the location to apply them to replacement
  traverse_parse_tree_preorder(paren_removal_parser.results, (node, parent_returned) => {
    if(node.type === 'u_factor' && node.rule === UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE) {
      if(open_paren_location_array.some(loc => loc === node.location - equality_node.location)) {
        let transformation_to_remove_parens_if_applicable = get_transformation_to_remove_parens(result_with_no_parens_removed, parent_returned, node);
        if(transformation_to_remove_parens_if_applicable !== null) {
          paren_removal_transformations.push(transformation_to_remove_parens_if_applicable);
        }
      }
    } else if(node.type === 'sign_u_term_pair') {
      return node;
    }
    return parent_returned;
  });
  return object_spread(
    transformation_with_no_parens_removed,
    {replacement: get_text_after_multiple_transformations(
      replacement,
      paren_removal_transformations.map(
        transf => object_spread(transf, {location: transf.location - equality_node.location})
      ))}
  );
}


function get_golden_rule_action_div(input, equality) {
  if(equality.rule !== EQUALITY_RULE) {
    throw "get_golden_rule_action_div_html equality.rule !== EQUALITY_RULE";
  }
  let operator_input_element, expression_input_element;
  let button_div;
  let handle_change = () => {
    let operator = operator_input_element.val();
    let expression = expression_input_element.val();
    try {
      let operator_parser = new nearley.Parser(COMPILED_GRAMMAR);
      operator_parser.feed("x=1" + operator + "z");
      if(operator_parser.results.length < 1) {
        throw "operator parser did not terminate";
      }
      let expression_parser = new nearley.Parser(COMPILED_GRAMMAR);
      expression_parser.feed('x=' + expression);
      if(expression_parser.results.length < 1) {
        throw "expression parser did not terminate";
      }

      // operator and expression inputs are valid
      button_div.html(get_button_html_of_transformation(input, get_golden_rule_transformation(input, equality, operator, expression)));
    } catch(e) {
      button_div.html('');
    }
  };
  let div = $("<div></div>");
  $('<span>Operator</span>').appendTo(div);
  operator_input_element = $('<input type="text"><br>')
    .keyup(handle_change)
    .appendTo(div);
  $('<span>Expression</span>').appendTo(div);
  expression_input_element = $('<input type="text">')
    .keyup(handle_change)
    .appendTo(div);
  button_div = $("<div></div>").appendTo(div);
  return div;
}




function get_shorten_action_div(input, expression) {
  let replace_button_div;
  let div = $("<div></div>");
  $("<div></div>")
    .append(
      $('<button>Compute Shortened Expression of ' + get_string(input, expression) + '</button>')
        .click(function() {
          let shorten_result = shorten(input, expression);
          if(typeof shorten_result === 'string') {
            replace_button_div.html(shorten_result);
          } else {
            let replacement = shorten_result[0];
            replace_button_div.html(String(get_string(input, expression).length - replacement.length) + " chars shorter: " + get_button_html_of_transformation(input, {
              location: expression.location,
              num_chars: expression.num_chars,
              replacement,
              type: SHORTEN_TYPE
            }));
          }
        }))
    .appendTo(div);
  replace_button_div = $("<div></div>").appendTo(div);
  return div;
}

function get_history_entry_div(entry_id, input_before, transformation) {
  return $("<div id='" + HISTORY_ENTRY_DIV_PREFIX + String(entry_id) + "' style='width: 100%; float: left; height: inherited;'></div>").append(
    $("<span style='float: left;'>" + transformation.type + "</span><br>")
  ).append(
    $("<div style='float: left;'>" + get_string_after_transformation_html(input_before, transformation) + "</div>")
  ).append(
    $("<button style='float: right;'>restore</button>").click(function() {
      transformation_on_click_given_input_and_transformation('', {
        location: 0,
        num_chars: Infinity,
        replacement: get_text_after_transformation(input_before, transformation),
        type: 'Restore'
      });
    })
  )
}

function history_push(input_before, transformation) {
  history.push(object_spread({string_before: input_before}, transformation));
  let history_scrollable_div = $('#history_scrollable_div');
  if(history_scrollable_div.length === 0) { // if jquery selector found no matches
    history_scrollable_div = $("<div id='history_scrollable_div' class='transformation_box card' style='height: 200px; width: 100%; overflow: scroll;'></div>");
    $('#history_div_container')
      .append("<h5>History</h5>")
      .append(history_scrollable_div);
    history_scrollable_div.append(get_history_entry_div(history.length, input_before, {
      location: 0,
      num_chars: 0,
      replacement: '',
      type: 'Initial State'
    }));
  }
  history_scrollable_div.append($('<hr style="margin: 3px;" />'));
  history_scrollable_div.append(get_history_entry_div(history.length, input_before, transformation));
  history_scrollable_div[0].scrollTop = history_scrollable_div[0].scrollHeight;
}

function remove_spaces_from_content(input_element) {
  const pos = input_element.selectionStart;
  input_element.value = input_element.value.split('').filter(c => c !== ' ' && c !== '\t' && c !== '\n').join('');
  input_element.selectionStart = input_element.selectionEnd = pos;
}


function hash_array(array, delimiter = '') {
  let hashes = array.map(hash_node);
  hashes.sort();
  return hashes.reduce(
    (accumulator, next_hash) => {
      return accumulator + delimiter + next_hash;
    }, 
    ''
  );
}
let SPECIAL_HASH_TECHNIQUES = {
  // 'main': (node) => hash_node(node.statement),
  'statement': (node) => hash_array(node.b_term_array, '|'),
  'b_term': (node) => hash_array(node.b_factor_array, '&'),
  'b_factor': (node) => {
      if(node.rule === BFACTOR_TO_PARENTHESISED_STATEMENT_RULE) {
        return 'b(' + hash_node(node.statement) + ')';
      } else { // node.rule === BFACTOR_TO_EQUALITY_RULE
        return hash_node(node.equality);
      }
    },
  'equality': (node) => hash_array(node.expression_array, '='),
  'expression': (node) => hash_array(node.sign_u_term_pair_array, '+'),
  'func': (node) => node.u_variable.identifier + '(' + hash_array(node.expression_array, ',') + ')',
  'u_term': (node) => hash_array(node.operator_u_factor_pair_array, '*'),
  'u_factor': (node) => {
      if(node.rule === UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE) {
        return 'u(' + hash_node(node.expression) + ')';
      } else if(node.rule === UFACTOR_TO_UVARIABLE_RULE) {
        return hash_node(node.u_variable);
      } else if(node.rule === UFACTOR_TO_FUNC_RULE) {
        return hash_node(node.func);
      } else { // node.rule === UFACTOR_TO_UNUMBER_RULE
        return hash_node(node.u_number);
      }
    },
  'u_number': (node) => String(node.value),
  'u_variable': (node) => node.identifier,
  'sign_u_term_pair': (node) => {
      return (node.sign === null ? '+' : node.sign.char) + hash_node(node.u_term);
    },
  'operator_u_factor_pair': (node) => {
      return (node.operator === null ? '*' : node.operator.char) + hash_node(node.u_factor);
    }
};
function hash_node(node) {
  // not a secure hash:
  // this function will be used to determine if nodes are equivalent by order change
  // and make nodes comparable
  // DON'T RELY ON THIS WORKING
  if(node !== null && node !== undefined) {
    if(node.type in SPECIAL_HASH_TECHNIQUES) {
      return SPECIAL_HASH_TECHNIQUES[node.type](node);
    } else {
      let key_array = [];
      for(let key in node) {
        if(key !== 'location' && key !== 'num_chars') {
          let value = node[key];
          if(Array.isArray(value)) {
            return hash_array(value);
          } else if(value !== null && typeof value === 'object' && value.type !== undefined) {
            key_array.push(key);
          }
        }
      }
      key_array.sort();
      return key_array.reduce((acc, next_key) => acc + hash_node(node[next_key]), '');
    }
  } else {
    return '';
  }
}


// https://stackoverflow.com/questions/9960908/permutations-in-javascript
function permutator(inputArr) {
  var results = [];

  function permute(arr, memo) {
    var cur, memo = memo || [];

    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  return permute(inputArr);
}


function get_all_variables_and_nearest_sign_u_term_pair(parse_tree) {
  // return type structure:
  // {VARIABLE_NAME: [{u_variable: u_variable node object, nearest_sign_u_term_pair: sign_u_term_pair node object}]}
  let map_from_variable_name_to_array_of_objects = {};
  traverse_parse_tree_preorder(parse_tree, function(node, parent_returned) {
    if(node.type === 'u_factor' && node.rule === UFACTOR_TO_UVARIABLE_RULE) {
      if(!(node.u_variable.identifier in map_from_variable_name_to_array_of_objects)) {
        map_from_variable_name_to_array_of_objects[node.u_variable.identifier] = [];
      }
      map_from_variable_name_to_array_of_objects[node.u_variable.identifier].push({u_variable: node.u_variable, nearest_sign_u_term_pair: parent_returned});
    } else if(node.type === 'sign_u_term_pair') {
      return node;
    }
    return parent_returned;
  });
  return map_from_variable_name_to_array_of_objects;
}


function group(groupingAttribute, object) {
  let arr = [];
  let index_meanings = [];
  for(let key in object) {
    for(let object_inner of object[key]) {
      let foundIndex = arr.indexOf(object_inner[groupingAttribute]);
      if(foundIndex === -1) {
        arr.push(object_inner[groupingAttribute]);
        index_meanings.push([object_inner]);
      } else {
        index_meanings[foundIndex].push(object_inner);
      }
    }
  }
  return index_meanings;
}

function get_string_of_u_factor_that_either_goes_to_u_variable_or_u_number(
  u_factor_that_either_goes_to_u_variable_or_u_number,
  ONLY_ONE_PARAMETER
) {
  if(ONLY_ONE_PARAMETER !== undefined) {
    throw "get_string_of_u_variable_or_u_number got 2 parameters; it should only get 1";
  }
  let string = null;
  if(u_factor_that_either_goes_to_u_variable_or_u_number.rule === UFACTOR_TO_UVARIABLE_RULE) {
    string = u_factor_that_either_goes_to_u_variable_or_u_number.u_variable.identifier;
  } else if(u_factor_that_either_goes_to_u_variable_or_u_number.rule === UFACTOR_TO_UNUMBER_RULE) {
    string = String(u_factor_that_either_goes_to_u_variable_or_u_number.u_number.value);
  }
  return string;
}

function my_set_cookie(key, value) {
  // key: string
  // value: serializable with JSON
  // serializes with JSON
  Cookies.set(key, JSON.stringify(value), { expires: 5555 /* days (forever) */ });
}
function my_get_cookie(key) {
  // key: string
  // returns undefined if cookies is not present
  // deserializes value with JSON
  const val = Cookies.get(key);
  if(val === undefined) {
    return undefined;
  } else {
    return JSON.parse(Cookies.get(key));
  }
}

