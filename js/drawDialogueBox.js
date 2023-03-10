function drawDialogueBox(message){

    //check that there is no previous dialogueBox already
    if ($('.dialogue-box').length < 2){


        // Create dialogueBox element
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'dialogue-box';

        const content = document.createElement('p');
        content.innerText = message;
        dialogueBox.appendChild(content);

        document.body.appendChild(dialogueBox);

        // Set the position of the dialogue box to the center of the viewport
        const dialogueBoxWidth = dialogueBox.offsetWidth;
        const dialogueBoxHeight = dialogueBox.offsetHeight;
        dialogueBox.style.left = `${window.innerWidth / 2 - dialogueBoxWidth / 2}px`;
        dialogueBox.style.top = `${window.innerHeight / 2 - dialogueBoxHeight / 2}px`;

        // Set a timeout to remove the dialogue box after 5 seconds
        setTimeout(() => {
            dialogueBox.classList.add('dialogue-box-fade-out');
            setTimeout(() => {
                dialogueBox.remove();
            }, 1000);
        }, 5000);
    }

}