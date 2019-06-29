


const IDENTITIES = {
  // '2-dist': 'a*(b+c)==a*b+a*c'
  // 'distributive': 'a*(sum(term))==sum(a*term)',
  // 'substitution': '(x=a&y=f(x))==x=a&y=f(a)',
  'Pythagorean': 'cos(x)*cos(x)+sin(x)*sin(x)==1',
  'Tangent Cofunction': 'cot(t)==tan((3.14159/2)-t)'
};
let computed_side_data = {};



function match_identity(target_node, identity_node, matches, nearest_sign_u_term_pair_in_target = null) {
  // target_node: a node in the parse tree of the input
  // identity_node: a node in the parse tree of the identity
  // matches: {identifier in identity: {identity_match_position_pair_array: [{location, num_chars}], target_node, nearest_sign_u_term_pair_in_target}}
  if(typeof target_node === 'object' && target_node !== null && typeof identity_node === 'object' && identity_node !== null) {
    if(target_node.type === 'sign_u_term_pair') {
      nearest_sign_u_term_pair_in_target = target_node;
    }
    if(identity_node.type === 'u_number' && target_node.type === 'u_number') {
      return identity_node.value === target_node.value;
    } else if(identity_node.type === 'u_factor' && identity_node.rule === UFACTOR_TO_UVARIABLE_RULE) {
      // look for u_factor, don't pick up on function names
      let identity_u_variable = identity_node.u_variable;
      if(identity_node.u_variable.identifier in matches) {
        if(matches[identity_u_variable.identifier].target_node.u_variable.identifier === identity_u_variable.identifier) {
          matches[identity_u_variable.identifier].identity_match_position_pair_array.push({location: identity_node.location, num_chars: identity_node.num_chars});
          return true;
        }
      } else {
        matches[identity_u_variable.identifier] = {
          identity_match_position_pair_array: [{location: identity_node.location, num_chars: identity_node.num_chars}],
          target_node,
          nearest_sign_u_term_pair_in_target
        };
        return true;
      }
    } else if(Array.isArray(target_node) && Array.isArray(identity_node)){
      if(target_node.length === identity_node.length) {
        for(let k = 0; k < target_node.length; k++) {
          if(!match_identity(target_node[k], identity_node[k], matches, nearest_sign_u_term_pair_in_target)) {
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    } else if(target_node.type === identity_node.type && target_node.rule === identity_node.rule) {
      let child_keys = [];
      for(let key in target_node) {
        if(target_node[key] === null ^ identity_node[key] === null) {
          return false;
        } else if(typeof target_node[key] === 'object' && target_node[key] !== null) {
          child_keys.push(key);
        }
      }
      return child_keys.every(child_key => match_identity(target_node[child_key], identity_node[child_key], matches, nearest_sign_u_term_pair_in_target))
    }
    return false;
  }
  return false;
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
        side_object = parser.results[0].statement.b_term_array[0].b_factor_array[0].equality.expression_array[0];
      } else {
        // assume it is an equality
        parser.feed(side_string);
        side_object = parser.results[0].statement.b_term_array[0].b_factor_array[0].equality;
      }
      return side_object;
    });
    computed_side_data[identity_key] = {side_strings, side_objects};
  }
  return JSON.parse(JSON.stringify(computed_side_data[identity_key]));
}