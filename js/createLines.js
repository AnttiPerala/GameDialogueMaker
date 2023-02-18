
        //CREATE LINES BETWEEN NODES

        //Here's where I'm stuck: I could just rotate the lines to a certain angle based on the number of the node they initially point to. But what happens then if things are moved around? Maybe that doesn't matter at this stage and maybe then we can just recalculate the roation
        //even the initial angle stuff becomes quite difficult because we don't know how many blocks there will be side by side
        //should I just give up with trying to add lines before the elemens are in DOM and do all lines in a separate pass after having added the elements?
        //Maybe I can create the lines in the loop, but then position them when everything is in DOM?


        function createLine(x1, y1, x2, y2, block1, block2, buttonindex, latestNodeForLines) {

            //block1 and block seem to depend on the selected block class, so they are unreliable here
            //for the new master object approach I think I will use the latestNodeForLines as the parent target

             console.log(`In the begnning, block1 is: ${block1} and block2 is ${block2} and buttonindex is ${buttonindex}`);

                let length = Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
                //let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                //let transform = 'rotate(' + angle + 'deg)';



                //get the parent of the first block so that we can prepend the line to it
               let blockWrapToPrependTo = latestNodeForLines.find(`.blockPlusButton[data-buttonindex="${buttonindex}"]`);
               ;

               console.log('blockWrapToPrependTo: ' + blockWrapToPrependTo.attr('data-buttonindex'));

               myElem = blockWrapToPrependTo;

                //create a condition circle element that will be added to the center of the line

             const conditionCircle = $('<div class="conditionCircle"title="Click here to add a condition for the transition">');

             //check if the line already exists and if it does, just move it. Seems like can't maybe trust on the "block1 and block2" much.. 


                 console.log('create line too');
                 let line = $('<div>')
                     .prependTo($('#mainArea')) //prepend makes lines appear in the back without having to use z-index
                     .addClass('line')
                     .width(length)
                     .offset({
                         left: 14,
                         top: 10
                     })
                     .attr("data-block1", block1)
                     .attr("data-block2", block2)
                     .attr("data-buttonindextoconnectto", buttonindex)
                     .append(conditionCircle)
                     ;

                 conditionCircle.css({
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
        
