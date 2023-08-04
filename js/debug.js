
$(document).ready(function () {

//UNCOMMENT TO GET DOM CHANGES: 
  /*   theMasterObjectInTheBeginning = _.cloneDeep(gameDialogueMakerProject);

    const observer = new MutationObserver((mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed.');
                console.log('Parent node:', mutation.target);
            }
            else if (mutation.type === 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified on element:', mutation.target);
                console.log('Element ID:', mutation.target.id);
                console.log('Element class list:', mutation.target.classList.toString());
                console.log('Element data attributes:', mutation.target.dataset);
            }
        }
    });

    observer.observe(document, { attributes: true, childList: true, subtree: true }); */


});

function diffObjects(obj1, obj2, path = '', visited = new WeakSet()) {
    if (_.isEqual(obj1, obj2) || visited.has(obj1) || visited.has(obj2)) {
        return [];
    }

    if (!_.isObject(obj1) || !_.isObject(obj2)) {
        return [{ path, oldValue: obj1, newValue: obj2 }];
    }

    visited.add(obj1).add(obj2);

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    const differences = [];

    for (const key of allKeys) {
        if (!_.isEqual(obj1[key], obj2[key])) {
            const newPath = path ? `${path}.${key}` : key;
            if (_.isObject(obj1[key]) && _.isObject(obj2[key])) {
                differences.push(...diffObjects(obj1[key], obj2[key], newPath, visited));
            } else {
                differences.push({ path: newPath, oldValue: obj1[key], newValue: obj2[key] });
            }
        }
    }

    return differences;
}





// This is the object whose state we'll track.
let obj = { a: 1, b: 2, c: { d: 3 } };

// We make a deep copy of the object to save its initial state.
let initialState = _.cloneDeep(obj);

// Then we change the object in some way.
obj.c.d = 4;
obj.c.e = 5;

// Then we compare the initial state of the object to its current state.
console.log(_.isEqual(initialState, obj));  // This will return false

// If you want to know the difference
console.log(diffObjects(initialState, obj));


/* $(window).resize(function () {
    const differences = diffObjects(theMasterObjectInTheBeginning, gameDialogueMakerProject);
    
    differences.forEach(diff => console.log(`Property ${diff.path} changed from ${JSON.stringify(diff.oldValue)} to ${JSON.stringify(diff.newValue)}`));
});

 */