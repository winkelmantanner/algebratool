

function construct_identity(name, lhs, rhs) {
  return {name, lhs, rhs};
}
let ci = construct_identity;
let identities = [
  ci('Pythagorean', 'cos(zxcv)*cos(zxcv)+sin(zxcv)*sin(zxcv)', '(1)'),
  ci('Pythagorean', 'cos(zxcv)*cos(zxcv)+sin(zxcv)*sin(zxcv)', '(1)'),
  ci('Cotangent Cofunction', 'cot(t)', 'tan((3.14159/2)-t)'),
  ci('Tangent Cofunction', 'tan(t)', 'cot((3.14159/2)-t)'),
  ci('Sine Cofunction', 'sin(t)', 'cos((3.14159/2)-t)'),
  ci('Cosine Cofunction', 'cos(t)', 'sin((3.14159/2)-t)'),
  ci('Secant Cofunction', 'sec(t)', 'csc((3.14159/2)-t)'),
  ci('Cosecant Cofunction', 'csc(t)', 'sec((3.14159/2)-t)'),
  ci('Sine Reciprocal', 'sin(x)', '1/csc(x)'),
  ci('Cosine Reciprocal', 'cos(x)', '1/sec(x)'),
  ci('Tangent Reciprocal', 'tan(x)', '1/cot(x)'),
  ci('Secant Reciprocal', 'sec(x)', '1/cos(x)'),
  ci('Cosecant Reciprocal', 'csc(x)', '1/sin(x)'),
  ci('Cotangent Reciprocal', 'cot(x)', '1/tan(x)'),
  ci('Product To Sum (sin times cos)', 'sin(a)*cos(b)', '(1/2)*(sin(a+b)+sin(a-b))'),
  ci('Product To Sum (cos times sin)', 'cos(a)*sin(b)', '(1/2)*(sin(a+b)-sin(a-b))'),
  ci('Product To Sum (sin times sin)', 'sin(a)*sin(b)', '(1/2)*(cos(a-b)-cos(a+b))'),
  ci('Product To Sum (cos times cos)', 'cos(a)*cos(b)', '(1/2)*(cos(a+b)+cos(a-b))'),
  ci('Multiplication of Powers', 'power(base,exp1)*power(base,exp2)', 'power(base,exp1+exp2)'),
  ci('Quadratic Formula', 'a*x*x+b*x+c=0', 'x=(-b+power(b*b-4*a*c,0.5))/(2*a)|x=(-b-power(b*b-4*a*c,0.5))/(2*a)')


].reduce((acc, next_identity) => {
  acc[Math.random()] = next_identity;
  return acc;
}, {});
let computed_side_data = {};



function match_identity(target_string, target_node, identity_node, matches, nearest_sign_u_term_pair_in_target = null) {
  // target_node: a node in the parse tree of the input
  // identity_node: a node in the parse tree of the identity
  // matches: {identifier in identity: {identity_match_position_pair_array: [{location, num_chars}], target_node, nearest_sign_u_term_pair_in_target}}
  if(
    typeof target_node === 'object'
    && target_node !== null
    && typeof identity_node === 'object'
    && identity_node !== null
    && target_node.type === identity_node.type
  ) {
    if(target_node.type === 'sign_u_term_pair') {
      nearest_sign_u_term_pair_in_target = target_node;
    }
    if(identity_node.type === 'func'
      && target_node.type === 'func'
      && identity_node.u_variable.identifier !== target_node.u_variable.identifier
    ) {
      return false;
    }
    if(identity_node.type === 'u_number' && target_node.type === 'u_number') {
      return identity_node.value === target_node.value;
    } else if(
      target_node.type === 'u_factor'
      && identity_node.type === 'u_factor'
      && identity_node.rule === UFACTOR_TO_UVARIABLE_RULE
    ) {
      // look for u_factor; don't pick up on function names
      let identity_u_variable = identity_node.u_variable;
      if(identity_node.u_variable.identifier in matches) {
        if(matches[identity_u_variable.identifier].corresponding_string === get_string(target_string, target_node)) {
          matches[identity_u_variable.identifier].identity_match_position_pair_array.push({location: identity_node.location, num_chars: identity_node.num_chars});
          return true;
        }
      } else {
        matches[identity_u_variable.identifier] = {
          identity_match_position_pair_array: [{location: identity_node.location, num_chars: identity_node.num_chars}],
          target_u_factor: target_node,
          corresponding_string: get_string(target_string, target_node),
          nearest_sign_u_term_pair_in_target
        };
        return true;
      }
    } else if(Array.isArray(target_node) && Array.isArray(identity_node)){
      if(target_node.length === identity_node.length) {
        for(let k = 0; k < target_node.length; k++) {
          if(!match_identity(target_string, target_node[k], identity_node[k], matches, nearest_sign_u_term_pair_in_target)) {
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    } else if(target_node.type === identity_node.type && target_node.rule === identity_node.rule) {
      if(identity_node.type === 'sign_u_term_pair') { // target_node.type === 'sign_u_term_pair'
        if(get_char_of_multiplied_sign_objects(identity_node.sign, target_node.sign) === '-') {
          return false;
        }
      } else if(identity_node.type === 'operator_u_factor_pair') { // target_node.type === 'operator_u_factor_pair'
        if(get_char_of_multiplied_operator_objects(identity_node.operator, target_node.operator) === '/') {
          return false;
        }
      }
      let child_keys = [];
      for(let key in target_node) {
        if(key !== 'sign' && key !== 'operator' && typeof target_node[key] === 'object' && target_node[key] !== null) {
          child_keys.push(key);
        }
      }
      return child_keys.every(child_key => match_identity(target_string, target_node[child_key], identity_node[child_key], matches, nearest_sign_u_term_pair_in_target));
    }
    return false;
  }
  return false;
}


function get_first_significant_descendant(node) {
  // Does not return an array, unless nested arrays are present in node
  let significant_keys = [];
  for(const key in node) {
    if(typeof node[key] === 'object' && node[key] !== null) {
      significant_keys.push(key);
    }
  }
  if(significant_keys.length >= 2) {
    return node;
  } else if(significant_keys.length === 1) {
    const child = node[significant_keys[0]];
    if(Array.isArray(child)) {
      let first_significant_descendant = get_first_significant_descendant(child);
      if(first_significant_descendant === child) {
        return node;
      } else {
        return first_significant_descendant;
      }
    } else {
      return get_first_significant_descendant(child);
    }
  } else { // node is a terminal
    return node;
  }
}

function get_sides_from_identity_with_given_key(identity_key) {
  if(!(identity_key in computed_side_data)) {
    let identity = identities[identity_key];
    let side_strings = [identity.lhs, identity.rhs];
    let side_objects = side_strings.map((side_string) => {
      let parser = new nearley.Parser(COMPILED_GRAMMAR);
      let side_object = null;
      if(side_string.indexOf('=') === -1) {
        // assume it is an expression
        parser.feed(side_string + '=x');
        side_object = get_first_significant_descendant(parser.results[0].statement.b_term_array[0].b_factor_array[0].equality.expression_array[0]);
      } else {
        // assume it is an equality
        parser.feed(side_string);
        side_object = get_first_significant_descendant(parser.results);
      }
      return side_object;
    });
    computed_side_data[identity_key] = {side_strings, side_objects};
  }
  return computed_side_data[identity_key];
}



function identity_set(new_identity_key, new_identity) {
  identities[new_identity_key] = new_identity;
  $('#identity_scrollable_div').empty().append(get_identities_list_content_jquery_object());
}
function identity_delete(identity_key) {
  delete identities[identity_key];
}

function get_identities_list_content_jquery_object(identity_name_box, identity_lhs_box, identity_rhs_box) {
  return Object.keys(identities).reduce((acc, identity_key) => acc.append(
      $("<tr><td>" + identities[identity_key].name + " Identity</td><td>" + identities[identity_key].lhs + " = " + identities[identity_key].rhs + "</td></tr>")
      .append(
        $('<td></td>').append(
          $('<button>Edit</button>').click(function() {
            $('#identity_container').empty().append(get_static_identity_jquery_object(EDIT_ACTION, identity_key))
          })
        )
      )
    ), $("<table></table>"));
}
function get_identities_list_jquery_object(identity_name_box, identity_lhs_box, identity_rhs_box) {
  return $("<div id='identity_scrollable_div' style='height: 300px; overflow: scroll; border: 3px inset blue;'></div>")
    .append(get_identities_list_content_jquery_object(identity_name_box, identity_lhs_box, identity_rhs_box));
}

const CREATE_ACTION = 'Create';
const EDIT_ACTION = 'Edit';
const DEFAULT_IDENTITY_KEY = null;
function get_static_identity_jquery_object(action=CREATE_ACTION, identity_key=DEFAULT_IDENTITY_KEY) {
  const identity_name_box = $("<input type='text' id='identity_name' /><span style='width: inherit; color: gray;'> Identity</span><br>");
  const identity_lhs_box = $("<input type='text' id='identity_lhs' /><br>");
  const identity_rhs_box = $("<input type='text' id='identity_rhs' /><br>");
  const button = $("<button>" + action + " Identity</button>");
  if(identity_key !== DEFAULT_IDENTITY_KEY) {
    const identity = identities[identity_key];
    identity_name_box.val(identity.name);
    identity_lhs_box.val(identity.lhs);
    identity_rhs_box.val(identity.rhs);
  }
  button.click(function() {
    identity_set(identity_key, construct_identity(identity_name_box.val(), identity_lhs_box.val(), identity_rhs_box.val()));
  });
  return $(get_standard_header("Identities"))
    .append(
      get_identities_list_jquery_object(identity_name_box, identity_lhs_box, identity_rhs_box)
    ).append(
      $("<div style='border: 3px inset blue;'></div>")
      .append("<span>" + action + (action === CREATE_ACTION ? " new" : "") + " identity</span><br>")
      .append("<span>Identity name: </span>").append(identity_name_box)
      .append("<span>Left hand side: </span>").append(identity_lhs_box)
      .append("<span>Right hand side: </span>").append(identity_rhs_box)
      .append(button)
    );
}