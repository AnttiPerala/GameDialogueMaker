// Example authoring pass: player speech belongs exclusively to answer nodes.
// Preserve NPC testimony and evidence, but remove automatic officer interjections.
function playerChoiceOnly(project, language = 'en') {
    const fi = language === 'fi';
    for (const character of project.characters) for (const node of character.dialogueNodes) {
        if (node.dialogueType === 'answer') continue;
        const original = node.dialogueText.split('\n');
        if (!node.dialogueSpeakers?.includes('player')) continue;
        let turns = original.map((text, i)=>({text, role:node.dialogueSpeakers[i]})).filter(t=>t.role !== 'player');
        const id = node.dialogueID;
        const append = text => turns.push({text,role:'npc'});
        if (character.characterID === 1) {
            if ([17,19].includes(id)) {
                turns = turns.filter(t=>!/(There you are|No niin\. Teidän)/.test(t.text));
                append(fi ? 'Siinä lokissahan on Leahin tunnus kello 21.06.14, ja katoamisesta ilmoitettiin 21.11. Eikö teidän pitäisi kysyä tästä siltä? Vai onko niissä kellonajoissa jotain epäselvää?' : "The log you've shown me has Leah's credential at 21:06:14, and the alarm was at 21:11. Shouldn't you ask her about that? Unless there's a problem with those times?");
            }
            if ([24,26,35].includes(id)) append(fi ? 'Jos kaapin kello jätätti ja oikea aika on 21.06.56, olin silloinkin ulkona. En käynyt toimistossa.' : 'If the cabinet clock was slow and the corrected time is 21:06:56, I was still outside then. I did not go into the office.');
            if ([31,33,42].includes(id)) append(fi ? 'Se kuvassa näkyvä tumma takki on mun. Tulin ilman laukkua ja lähdin takki käsissä. Jos tallenteen korjattu aika on 21.05.48, niin kai hain sen silloin.' : 'The dark coat in the footage is mine. I came in without a bag and left carrying it. If the corrected timestamp is 21:05:48, that must be when I collected it.');
            if ([38,40,47].includes(id)) for (const turn of turns) turn.text = turn.text.replace('Harmaa pussi.', 'Rahat olivat harmaassa pussissa.').replace('A grey pouch.', 'The money was in a grey pouch.');
            if (id === 45) for (const turn of turns) turn.text = turn.text.replace('Sinähän sanoit, että siinä oli oranssi side.', 'Sanoinko mä oranssi? En mä ole varma, mistä se tuli.').replace('You said there was an orange tie.', 'Did I say orange? I am not sure where that came from.');
            if ([59,61,70].includes(id)) for (const turn of turns) turn.text = turn.text.replace('Mun oma temppuili.', 'Käytin kaapin avaamiseen Leahin tunnusta, kun mun oma temppuili.').replace('Mine was unreliable.', "I used Leah's credential to open the cabinet because mine was unreliable.");
            if ([80,82].includes(id)) for (const turn of turns) turn.text = turn.text.replace('Mun työkaluvau', 'Rahat ovat mun työkaluvau').replace('Behind the removable bottom', 'The notes are behind the removable bottom');
            if (id === 77) append(fi ? 'Selvä. Tarkistakaa ne paperit. Mä odotan, mutta en aio arvailla, mitä siinä kuvassa näkyy.' : 'All right. Check the records. I will wait, but I am not going to guess what the photograph shows.');
        }
        if (character.characterID === 2) {
            if ([31,33,42].includes(id)) for (const turn of turns) turn.text = turn.text.replace('Olin silloin vielä haastattelussa.', 'Jos kaapin avausaika on kellovirheen korjaamisen jälkeen 21.06.56 eikä 21.06.14, olin silloinkin vielä haastattelussa.').replace('I was still in the meeting then.', 'If the corrected cabinet time is 21:06:56 rather than 21:06:14, I was still in the interview then.');
            if ([52,54,63].includes(id)) for (const turn of turns) turn.text = turn.text.replace('Maksamattomista ylitöistä.', 'Me riideltiin Danielin kanssa maksamattomista ylitöistä.').replace('About unpaid overtime.', 'The argument with Daniel was about unpaid overtime.');
            if ([66,68,77].includes(id)) for (const turn of turns) turn.text = turn.text.replace('Niin siinä kävi.', 'Salasin sen työhaastattelun, mutta olin oikeasti siellä. Hotellin pitäisi pystyä vahvistamaan se. Sen vanhan koodin annoin aiemmin, mutta en järjestänyt mitään rahojen noutoa. Mitä vielä pitää selvittää?').replace('That is what happened.', 'I hid the job interview, but I really was there. The hotel should be able to confirm that. I shared the old code earlier; I did not arrange a collection. What else needs checking?');
            if (id === 80) append(fi ? 'Hyvä. Mä haluan, että se selvitetään myös työpaikalla. Mutta mun työnhausta ei tarvitse kertoa kaikille.' : 'Thank you. I want the position corrected at work too. But everyone does not need to hear about my job search.');
        }
        const merged = [];
        for (const turn of turns) {
            if (merged.at(-1)?.role === turn.role) merged[merged.length - 1].text += ' ' + turn.text;
            else merged.push({...turn});
        }
        if (!merged.length) throw new Error(`Missing replacement for ${character.characterID}:${id}`);
        node.dialogueText = merged.map(t=>t.text).join('\n');
        node.dialogueSpeakers = merged.map(t=>t.role);
    }
    return project;
}
module.exports = {playerChoiceOnly};
