function positionAllLines(){

    $('.line').each(function(index) {

        //select correct block based on the data-block1 attribute of the line

        let block1toConnectTo = $(this).data('block1');
        let block2toConnectTo = $(this).data('block2');
        let block1buttonIndexToConnectTo = $(this).data('buttonindextoconnectto');

        let block1FromDOM = $(`.id${block1toConnectTo}`);
        let block2FromDOM = $(`.id${block2toConnectTo}`);

        let plusButtonToConnectTo = block1FromDOM.find(`.blockPlusButton[data-buttonindex="${block1buttonIndexToConnectTo}"]`)

        myElem = block2FromDOM;



const $element1 = plusButtonToConnectTo;
const $element2 = block2FromDOM;
const offset1 = $element1.offset();
const offset2 = $element2.offset();

const x1 = offset1.left + $element1.outerWidth() / 2;
const y1 = offset1.top + $element1.outerHeight() / 2;
const x2 = offset2.left + $element2.outerWidth() / 2;
const y2 = offset2.top + $element2.outerHeight() / 2;
const midX = (x1 + x2) / 2;
const midY = (y1 + y2) / 2;

$(this).css({
  position: 'absolute',
  left: midX + 'px',
  top: midY + 'px',
  width: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) + 'px',
  height: '2px',
  backgroundColor: 'black',
  transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`, 
});
    

})

}