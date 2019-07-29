




function get_sequence(prev, target, initial) {
  sequence = [];
  let current = target;
  while(current !== initial) {
    sequence.push(current);
    current = prev[current];
  }
  return sequence;
}

function construct_priority_string(priority, string) {
  return {priority, string};
}

function shorten(input, expression_object) {
  const EXPRESSION_PREFIX = 'x='; // unfortunately, we need to prefix everything with x= to get valid statements
  let already_traversed = {};
  let num_traversed = 0;
  let q = new PriorityQueue(function(a, b) {return a.priority < b.priority;});
  q.push(construct_priority_string(0, EXPRESSION_PREFIX + get_string(input, expression_object)));
  already_traversed[q.peek().string] = '';
  let shortest_string = q.peek().string;
  let shortest_string_length = q.peek().string.length;
  while(q.size() > 0 && num_traversed < SHORTEN_SEARCH_LIMIT) {
    num_traversed++;
    let current_string = q.pop().string;
    if(current_string.length < shortest_string_length) {
      shortest_string_length = current_string.length;
      shortest_string = current_string;
    }
    try {
      let expression_parser = new nearley.Parser(COMPILED_GRAMMAR);
      expression_parser.feed(current_string);
      if(expression_parser.results.length === 0) {
        throw 'asdf';
      }
      let local_expression_object = expression_parser.results[0].statement.b_term_array[0].b_factor_array[0].equality.expression_array[1];
      let transformations = get_array_of_transformations(current_string, local_expression_object);
      // it used to be possible to generate indefinite parenthesis nesting via distribute and reverse distribute
      // to prevent an infinite number of possible states, do not explore other options when removing parentheses is available
      let remove_parenthesis_available = transformations.some(t => t.type === REMOVE_PARENTHESIS_TYPE);
      for(let transformation of transformations) {
        if(transformation.special !== true
          && (!remove_parenthesis_available || transformation.type === REMOVE_PARENTHESIS_TYPE)
        ) {
          let text_after = get_text_after_transformation(current_string, transformation);
          if(!(text_after in already_traversed)) {
            q.push(construct_priority_string(SHORTEN_PRIORITIES[transformation.type], text_after));
            already_traversed[text_after] = current_string;
          }
        }
      }
    } catch(e) {
      throw String(e) + get_sequence(already_traversed, current_string, '').map(s => s.slice(EXPRESSION_PREFIX.length));
    }
  }
  if(shortest_string_length - 2 < get_string(input, expression_object).length) {
    return get_sequence(already_traversed, shortest_string, '').map(s => s.slice(EXPRESSION_PREFIX.length));
  } else {
    if(num_traversed >= SHORTEN_SEARCH_LIMIT) {
      return 'No shorter equivalent found after ' + num_traversed + ' states were searched';
    } else if(shortest_string === EXPRESSION_PREFIX + get_string(input, expression_object)) {
      return 'No shorter equivalent found.  All ' + String(num_traversed) + ' reachable states were searched.';
    }
  }
}