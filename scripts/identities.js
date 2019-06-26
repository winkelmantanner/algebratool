


const IDENTITIES = {
  '2-dist': 'a*(b+c)==a*b+a*c'
  // 'distributive': 'a*(sum(term))==sum(a*term)',
  // 'substitution': '(x=a&y=f(x))==x=a&y=f(a)',
  // 'pythagorean': 'cos(x)*cos(x)+sin(x)*sin(x)==1'
};



function match_identity(target_node, identity_node, matches, extra = {}) {
  // target_node: a node in the parse tree of the input
  // identity_node: a node in the parse tree of the identity
  // matches: a map from identity variable name to input parse tree object reference
  if(typeof target_node === 'object' && target_node !== null && typeof identity_node === 'object' && identity_node !== null) {
    if(target_node.type === 'sign_u_term_pair') {
      extra.nearest_sign_u_term_pair_in_target = target_node;
    }
    if((target_node.type === 'u_variable' || target_node.type === 'u_number') && identity_node.type === 'u_variable') {
      if(identity_node.identifier in matches) {
        if(matches[identity_node.identifier].identifier === target_node.identifier) {
          return true;
        }
      } else {
        matches[identity_node.identifier] = extra.nearest_sign_u_term_pair_in_target;
        return true;
      }
    } else if(Array.isArray(target_node) && Array.isArray(identity_node)){
      if(target_node.length === identity_node.length) {
        for(let k = 0; k < target_node.length; k++) {
          if(!match_identity(target_node[k], identity_node[k], matches, extra)) {
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
        }
        if(typeof target_node[key] === 'object' && target_node[key] !== null) {
          child_keys.push(key);
        }
      }
      return child_keys.every(child_key => match_identity(target_node[child_key], identity_node[child_key], matches, extra))
    }
    return false;
  }
  return false;
}