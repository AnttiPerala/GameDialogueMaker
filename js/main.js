let newBlockId = 1;
        let moveLineId = "moveLine";
        let cloneMode = false; //for style cloning
        let eraseMode = false; //for erasing blocks and lines
        let selectedSize = 200;
        let selectedColor = '#DC143C';
        let selectedFontSize = "1rem";

        //call autoresize for the existing box
        addAutoResize();

        //auto resize text area, the textareas need  data-autoresize attribute, also need to call addAutoResize() after adding to dom:
        function addAutoResize() {
                document.querySelectorAll('[data-autoresize]').forEach(function (element) {
                    element.style.boxSizing = 'border-box';
                    var offset = element.offsetHeight - element.clientHeight;
                    element.addEventListener('input', function (event) {
                        event.target.style.height = 'auto';
                        event.target.style.height = event.target.scrollHeight + offset + 'px';
                    });
                    element.removeAttribute('data-autoresize');
                });
            }

        //Needed for tooltips to work:
        $(function () {
                $(document).tooltip({ //track will make the tooltip follow the mouse curser location
                     track: true   
                }

            )
        });

        $("#mainArea").draggable();
        $("#mainArea").draggable('enable');

        $('.blockWrap').draggable({
            drag: function (event, ui) {
                //console.log('dragging');
                updateLines($(this).find('.block'));
            }
        });

        //CREATE BLOCKS BY CLICKING ON THE PLUS BUTTON:

       


        //CREATE LINES BETWEEN NODES

         function createLine(x1, y1, x2, y2, block1, block2) {

                let length = Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
                let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                let transform = 'rotate(' + angle + 'deg)';

                offsetX = (x1 > x2) ? x2 : x1;
                offsetY = (y1 > y2) ? y2 : y1;

                let line = $('<div>')
                    .prependTo('#mainArea') //prepend makes lines appear in the back without having to use z-index
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
                    ;

                /* if (id != null) line.attr('id', id); */

                return line;
            }

             //SHIFT CLICK TO DRAW A LINE

                $('body').on('mouseup', '.block', function (event) {

                    if (event.shiftKey) { //check if shift was down while the event fired

                        let selectedBlock = $('.selected'); //get the currently selected block
                        //let selectedBlockWrap = selectedBlock.parent('.blockWrap'); //get the currently selected block
                        //let thisParent = $(this).parent('.blockWrap'); //clicked block wrap

                        let x1Pos = selectedBlock[0].offset().left + selectedBlock[0].getBoundingClientRect().width / 2;
                        let y1Pos = selectedBlock[0].offset().top + selectedBlock[0].getBoundingClientRect().height / 2;
                        let x2Pos = $(this)[0].getBoundingClientRect().left + $(this)[0].getBoundingClientRect().width / 2;
                        let y2Pos = $(this)[0].getBoundingClientRect().top + $(this)[0].getBoundingClientRect().height / 2;

                        createLine(x1Pos, y1Pos, x2Pos, y2Pos, selectedBlock.attr('id'), $(this).attr('id'));

                        //console.log(` selectedBlock[0].getBoundingClientRect().width ${selectedBlock[0].getBoundingClientRect().width} selectedBlock[0].getBoundingClientRect().height ${selectedBlock[0].getBoundingClientRect().height}  $(this)[0].getBoundingClientRect().width ${$(this)[0].getBoundingClientRect().width} $(this)[0].getBoundingClientRect().height ${$(this)[0].getBoundingClientRect().height}`);

                    }

                })

           
             //MOVE A DRAGGABLE BLOCK WITH LINES CONNECTED TO IT

                let allConnectedLines;

                function updateLines(element){

                    //let elementChildBlock = $(element).children('.block'); //wrapper was passed in, now drill in to the block

                    globalCheck = $(element).attr('id');

                    //select the lines connected to the element we are monving based on the data attributes on the lines
                    let allConnectedLines = $('.line[data-block1="' + $(element).attr('id') + '"],.line[data-block2="' + $(element).attr('id') + '"]');

                    //console.log('element id is ' + $(element).attr('id') + ' allConnectedLines length: ' + allConnectedLines.length);


                    //for redrawing them we need to loop through all the selected lines and for each of them we will get the two data attributes, then select two blocks based on those attributes and get the coordinates of those blocks for redrawing
                    //finally we destroy the old connected lines

                    allConnectedLines.each(function (i, e) {

                        let lineBlockConnect1 = $(e).data('block1'); //get the block ids from the lines
                        let lineBlockConnect2 = $(e).data('block2');

                        console.log('lineBlockConnect1: ' + lineBlockConnect1 + ' lineBlockConnect2: ' + lineBlockConnect2);

                        let block1 = $('#' + lineBlockConnect1); //select the block from dom
                        let block2 = $('#' + lineBlockConnect2); //select the block from dom

                        let plusButton = block1.parents('.blockWrap').find('.blockPlusButton');
                        let topSocket =  block2.parents('.blockWrap').find('.topConnectionSocket');

                        let x1Pos = plusButton.offset().left + plusButton[0].getBoundingClientRect().width / 2;
                        let y1Pos = plusButton.offset().top + plusButton[0].getBoundingClientRect().height / 2;
                        let x2Pos = topSocket.offset().left + topSocket[0].getBoundingClientRect().width / 2;
                        let y2Pos = topSocket.offset().top + topSocket  [0].getBoundingClientRect().height / 2;

                        $(this).remove();

                        createLine(x1Pos, y1Pos, x2Pos, y2Pos, block1.attr('id'), block2.attr('id'));

                    })
                
                }


           


            //CHANGE BLOCK SIZE WHEN RANGE SLIDER IS MOVED

            $('#blocksize').on('change input', function(){
                //console.log(`change ${$(this).val()}`);
                //$('.selected').css("width", $(this).val());
                let scaleValue = $(this).val()/100;
                $('.selected').css({ 'transform': 'scale(' + scaleValue + ')'});
                //$('.block input').css("font-size", $(this).val()/8+10 +'px');
                selectedSize = scaleValue;
            })

            //CHANGE ZOOM WHEN RANGE SLIDER IS MOVED

                $('#zoomAmount').on('change input', function () {
                    console.log(`change zoom to ${$(this).val()} %`);
                    //$('.selected').css("width", $(this).val());
                    let zoomValue = $(this).val();
                    $('#mainArea').css({ 'zoom': zoomValue + '%' });
                    //$('.block input').css("font-size", $(this).val()/8+10 +'px');
                    
                })

            //COLOR PICKER
       
            $('#blockColor').on('change input', function () {
                    //console.log(`change ${$(this).val()}`);
                    $('.selected').css("background-color", $(this).val());
                    selectedColor = $(this).val(); //for cloning
                })


            //ACCEPT INPUT TEXT FOR BLOCKS WITH ENTER

            $(document).on('keypress', function (e) {
                    if (e.which == 13) {
                        //console.log(`enter ${''}`);
                        $(".block input").blur(); //removes focus
                    }
                });

            //COPY FORMATTING BRUSH FEATURE

            //enable or disable clone brush
            $('#stylebrush').on('click', function(){
                cloneMode = !cloneMode; //toggle boolean

                 //when clone mode is on:
                if (cloneMode) {
                    $('body').css('cursor', 'url(iconmonstr-paintbrush-3-64.png) 16 32, auto'); //16 32 are the interaction point coordinates of the cursor #0075ff
                } else {
                    $('body').css('cursor', 'unset');
                }
         
            })

            //clicking on a block with clonemode on

            
                $('body').on('mousedown', '.block', function () {
                    if (cloneMode) {
                        console.log(`set values now, selectedColor is ${selectedColor}`);
                        $(this).css('transform', 'scale(' + selectedSize + ')');
                        $(this).css('background-color', selectedColor);
                        $(this).children('input').css('font-size', selectedFontSize);
                    }
                }
                );

            //clicking on just the body with the clonemode on:
             $('#mainArea').click(function (e) {
                    if (!$(e.target).hasClass("block") && $(e.target).prop("tagName") != 'input') { //not clicking on block or input field
                        cloneMode = false;
                        eraseMode = false;
                         $('body').css('cursor', 'unset');
                    }
                });


            //ERASER TOOL

             //enable or disable clone brush
                $('#eraser').on('click', function () {
                    eraseMode = !eraseMode; //toggle boolean

                    //when clone mode is on:
                    if (eraseMode) {
                        $('body').css('cursor', 'url(iconmonstr-eraser-1-48.png) 16 32, auto');
                    } else {
                        $('body').css('cursor', 'unset');
                    }

                })

            
                //clicking on a block with erasemode on


                    $('body').on('mousedown', '.block, .line', function () {
                        if (eraseMode) {
                            //console.log(`erase ${this}`);

                            //loop through the connected lines that should also be erased
                             let allConnectedLines = $('.line[data-block1="' + $(this).attr('id') + '"],.line[data-block2="' + $(this).attr('id') + '"]');

                             $(allConnectedLines).remove();

                            $(this).remove();

                        }
                    }
                    );

           
           //SAVE PAGE TO LOCALSTORAGE
                $('#save').on('click', function () {
                    //alert('save');

                    //create an object

                    let blocksAndLines = {

                        blocks: [],
                        lines: []

                    };

                    let selectBlocksFromPage = $('.block');
                    let selectLinesFromPage = $('.line');

                    selectBlocksFromPage.each(function(i,e){

                        let newBlock = {

                            id: $(this).attr('id'),
                            left: $(this).offset().left,
                            top: $(this).offset().top,
                            bgColor: $(this).css('background-color'),
                            width: $(this)[0].getBoundingClientRect().width,
                            text: $(this).children('input').val()
                            
                            };

                        blocksAndLines.blocks.push(newBlock);

                        checkit = blocksAndLines;


                    }) //end each

                    let stringToSave = JSON.stringify(blocksAndLines);
                    localStorage.setItem('mySave', stringToSave);




                }) //end save click

                //recreate objects based on save (not fully functional yet)
                $(document).ready(function () {
                        let retrievedObject = localStorage.getItem('mySave');

                        if (retrievedObject != null){
                            let saveObject = JSON.parse(retrievedObject);
                            $('.blockWrap').remove(); //delete any existing blocks
                            check2 = saveObject; //just for checking in console

                            $(saveObject.blocks).each(function(i,e){

                                 $('<div class="blockWrap"><div class="block"><input type="text" placeholder="Type something"></div></div>')
                                    .prependTo('#mainArea')
                                    .draggable({
                                        drag: function (event, ui) {
                                            //console.log('dragging');
                                            updateLines($(this).find('.block'));
                                        }
                                    })
                                    .children('.block')
                                    .attr('id', 'id' + e.id)
                                    .css({ top: e.top, left: e.left })
                                    .children('input').val(e.text)
                                    ;
                                ;

                            })
                        }

                    });


                //DELETE SAVES

                 $('#delete').on('click', function () {
                      

                        localStorage.removeItem('mySave');
                         location.reload(); //refresh page


                    }) //end save click

        
            //PRINT (SCREENSHOT)
            
             $('#print').on('click', function () {

                    //need to run this on a server for security reasons. Open CMD in the root folder and python -m http.server 8000 then open http://127.0.0.1:8000/ in your browser
                    const screenshotTarget = document.body;

                    //requires html2canvas script
                    html2canvas(screenshotTarget).then((canvas) => {
                        const base64image = canvas.toDataURL("image/png");
                        window.document.write('<iframe src="' + base64image + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                    });

                })



            //CTRL DRAG TO MAKE A COPY
       

       //icons hex #6d81fe