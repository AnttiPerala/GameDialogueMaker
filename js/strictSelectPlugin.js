$.fn.strictSelect = function (selector) {
    var $result = this.find(selector);
    if ($result.length === 0) {
        throw new Error("Selector '" + selector + "' did not match any elements.");
    }
    return $result;
};

//use like this 
//var $myElement = $('#nonexistent').strictSelect('span');
