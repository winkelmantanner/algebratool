


const IDENTITIES = {
  'Pythagorean': 'cos(zxcv)*cos(zxcv)+sin(zxcv)*sin(zxcv)==(1)',
  'Cotangent Cofunction': 'cot(t)==tan((3.14159/2)-t)',
  'Tangent Cofunction': 'tan(t)==cot((3.14159/2)-t)',
  'Sine Cofunction': 'sin(t)==cos((3.14159/2)-t)',
  'Cosine Cofunction': 'cos(t)==sin((3.14159/2)-t)',
  'Secant Cofunction': 'sec(t)==csc((3.14159/2)-t)',
  'Cosecant Cofunction': 'csc(t)==sec((3.14159/2)-t)',
  'Sine Reciprocal': 'sin(x)==1/csc(x)',
  'Cosine Reciprocal': 'cos(x)==1/sec(x)',
  'Tangent Reciprocal': 'tan(x)==1/cot(x)',
  'Secant Reciprocal': 'sec(x)==1/cos(x)',
  'Cosecant Reciprocal': 'csc(x)==1/sin(x)',
  'Cotangent Reciprocal': 'cot(x)==1/tan(x)',
  'Product To Sum (sin times cos)': 'sin(a)*cos(b)==(1/2)*(sin(a+b)+sin(a-b))',
  'Product To Sum (cos times sin)': 'cos(a)*sin(b)==(1/2)*(sin(a+b)-sin(a-b))',
  'Product To Sum (sin times sin)': 'sin(a)*sin(b)==(1/2)*(cos(a-b)-cos(a+b))',
  'Product To Sum (cos times cos)': 'cos(a)*cos(b)==(1/2)*(cos(a+b)+cos(a-b))',
  'Multiplication of Powers': 'power(base,exp1)*power(base,exp2)==power(base,exp1+exp2)',
  'Quadratic Formula': 'a*x*x+b*x+c=0==x=(-b+power(b*b-4*a*c,0.5))/(2*a)|x=(-b-power(b*b-4*a*c,0.5))/(2*a)'


};
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
    let identity = IDENTITIES[identity_key];
    let side_strings = identity.split('==');
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




function get_static_identity_html() {
  return get_standard_header("Identities")
    + "<div id='identity_scrollable_div' style='height: 300px; overflow: scroll; border: 3px inset blue;'>"
    + Object.keys(IDENTITIES).reduce((acc, identity_key) => acc + IDENTITIES[identity_key] + "<br>", '')
    + "</div>";
}