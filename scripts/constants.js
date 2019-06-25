

const MY_MARK = 'MY_MARK';
const SHORTEN_SEARCH_LIMIT = 5000;

const ADDITION_RULE = 'ADDITION_RULE';
const UTERM_TO_UNUMBER_RULE = 'UTERM_TO_UNUMBER_RULE';
const UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE = 'UFACTOR_TO_PARENTHESISTED_EXPRESSION_RULE';
const UFACTOR_TO_UNUMBER_RULE = 'UFACTOR_TO_UNUMBER_RULE';
const SCALE_RULE = 'SCALE_RULE';
const EQUALITY_RULE = 'EQUALITY_RULE';
const DISJUNCTION_RULE = 'DISJUNCTION_RULE';
const CONJUNCTION_RULE = 'CONJUNCTION_RULE';
const BFACTOR_TO_PARENTHESISED_STATEMENT_RULE = 'BFACTOR_TO_PARENTHESISED_STATEMENT_RULE';
const BFACTOR_TO_EQUALITY_RULE = 'BFACTOR_TO_EQUALITY_RULE';
const UFACTOR_TO_UVARIABLE_RULE = 'UFACTOR_TO_UVARIABLE_RULE';
const UFACTOR_TO_FUNC_RULE = 'UFACTOR_TO_FUNC_RULE';


const COMBINE_NUMBER_TYPE = 'Combine Numbers';
const CHANGE_ORDER_TYPE = 'Change Order';
const DISTRIBUTE_SIGN_TYPE = 'Distribute Sign';
const DISTRIBUTE_TYPE = 'Distribute';
const REVERSE_DISTRIBUTE_TYPE = 'Reverse Distribute';
const CANCEL_TYPE = 'Cancel';
const REMOVE_ZERO_TYPE = 'Remove Zero';
const REMOVE_ONE_TYPE = 'Remove One';
const GOLDEN_RULE_OF_ALGEBRA_TYPE = "Golden Rule of Algebra";
const SHORTEN_TYPE = 'Shorten';
const REMOVE_PARENTHESIS_TYPE = 'Remove Parenthesis';
const SUBSTITUTE_TYPE = 'Substitute';
const MANUAL_CHANGE_TYPE = 'Manual Change';








let SHORTEN_PRIORITIES = {};
SHORTEN_PRIORITIES[COMBINE_NUMBER_TYPE] = 300/10;
SHORTEN_PRIORITIES[CHANGE_ORDER_TYPE] = 300/1;
SHORTEN_PRIORITIES[CHANGE_ORDER_TYPE] = 300/3;
SHORTEN_PRIORITIES[DISTRIBUTE_TYPE] = 300/5;
SHORTEN_PRIORITIES[REVERSE_DISTRIBUTE_TYPE] = 300/4;
SHORTEN_PRIORITIES[CANCEL_TYPE] = 300/50;
SHORTEN_PRIORITIES[REMOVE_ZERO_TYPE] = 300/20;
SHORTEN_PRIORITIES[REMOVE_ONE_TYPE] = 300/20;
SHORTEN_PRIORITIES[GOLDEN_RULE_OF_ALGEBRA_TYPE] = undefined; // special
SHORTEN_PRIORITIES[SHORTEN_TYPE] = undefined; // special
SHORTEN_PRIORITIES[REMOVE_PARENTHESIS_TYPE] = Infinity;
SHORTEN_PRIORITIES[SUBSTITUTE_TYPE] = undefined;




