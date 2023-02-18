
        //CREATE LINES BETWEEN NODES

        function createLine(x1, y1, x2, y2, block1, block2, buttonindex) {

            //block1 and block seem to depend on the selected block class, so they are unreliable here

             console.log(`In the begnning, block1 is: ${block1} and block2 is ${block2}`);

                let length = Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
                let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                let transform = 'rotate(' + angle + 'deg)';

                offsetX = (x1 > x2) ? x2 : x1;
                offsetY = (y1 > y2) ? y2 : y1;

                //get the parent of the first block so that we can prepend the line to it
               let blockWrapToPrependTo = $('#'+block1).closest('.blockWrap');

                //create a condition circle element that will be added to the center of the line

             const conditionCircle = $('<div class="conditionCircle"title="Click here to add a condition for the transition">');

             //check if the line already exists and if it does, just move it. Seems like can't maybe trust on the "block1 and block2" much.. 


             let linesToCheck = blockWrapToPrependTo.closest('.blockWrap').find('.line'); //go to the earlier parent and look for lines
             if (linesToCheck[0] !== undefined) {
                 console.log(`linesToCheck: ${linesToCheck.eq(0).data('block1')}`);
             }

             let attribute1 = 'block1'; // set the names of the data attributes you want to match
             let attribute2 = 'block2';
             let attribute3 = 'buttonindextoconnectto';

            

             let matchingElements = linesToCheck.filter(function () {

                 console.log(`
                    $(this).data(attribute1) was ${$(this).data(attribute1)}
                    block1 was ${block1}
                    $(this).data(attribute2) was ${$(this).data(attribute2)}
                    block1 was ${block2}
                    $(this).data(attribute3) was ${$(this).data(attribute3)}
                    buttonindextoconnectto was ${buttonindex}
              `);

                 if ($(this).data(attribute1) === block1 && // check if the three data attributes match
                     $(this).data(attribute2) === block2 &&
                     $(this).data(attribute3) === buttonindex){
                         return this; // return the element that matches the three data attributes
                     }
                
             });

             if (matchingElements.length > 0) {
                 // At least one element matches the three data attributes so just redraw
                 console.log('line redraw only');
                 let matchedLine = matchingElements[0];
                 matchedLine.css({
                     'position': 'absolute',
                     'transform': transform
                 })
                     .width(length)
                     .offset({
                         left: offsetX,
                         top: offsetY
                     })

             } else {
                 // No elements match the three data attributes so append
                 console.log('create line too');
                 let line = $('<div>')
                     .prependTo(blockWrapToPrependTo) //prepend makes lines appear in the back without having to use z-index
                     .addClass('line')
                     .css({
                         'position': 'absolute',
                         'transform': transform
                     })
                     .width(length)
                     .offset({
                         left: offsetX,
                         top: offsetY
                     })
                     .attr("data-block1", block1)
                     .attr("data-block2", block2)
                     .attr("data-buttonindextoconnectto", buttonindex)
                     .append(conditionCircle)
                     ;

                 conditionCircle.css({
                     'transform': `translate(-50%, -50%) rotate(${angle * -1}deg)`, //rotate this in the opposite direction of the parent line in order to keep it straight
                     'top': '50%',
                     'left': '50%'

                 })

                 /*  const centerX = (x1 + x2) / 2;
                  const centerY = (y1 + y2) / 2;
     
                  conditionCircle.offset({
                      left: offsetX + length /2,
                      top: offsetY
                  }).css({
                      'transform': transform
                  }) */

                 /* if (id != null) line.attr('id', id); */

                 return line;
             }
        }
