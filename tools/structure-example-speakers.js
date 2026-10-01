// One-time authoring migration for the investigation examples, not runtime parsing.
// Runtime speaker identity is a role, never a hard-coded person's name.
function structureExampleSpeakers(project, language = 'en') {
    for (const character of project.characters) for (const node of character.dialogueNodes) {
        if (node.dialogueSpeakers) continue;
        const pages = [], speakers = [];
        let role = node.dialogueType === 'answer' ? 'player' : 'npc';
        const push = (text, speaker) => {
            for (let line of text.trim().split(/\r?\n/)) {
                line = line.trim();
                line = line.replace(/^(?:Daniel|Leah|Ellis),\s*/, '');
                if (language === 'fi') line = line.replace('Olen Ellis, poliisista.', 'Olen poliisista.').replace(/\bEllisin\b/g, 'poliisin').replace(/\bEllis\b/g, 'poliisi');
                else line = line.replace('I am Officer Ellis.', 'I am the officer handling the interview.').replace(/\b(?:Officer )?Ellis\b/g, 'the officer');
                if (line) { pages.push(line); speakers.push(speaker); }
            }
        };
        const text = node.dialogueText;
        const tokens = /\[[^\]]*\]|\b(?:Officer Ellis|Ellis|Daniel|Leah|Morgan):\s*/g;
        let cursor = 0;
        for (const match of text.matchAll(tokens)) {
            push(text.slice(cursor, match.index), role);
            if (match[0][0] === '[') {
                push(match[0].slice(1, -1).replace(/^(?:DANIEL|LEAH):\s*/, ''), 'scene');
            } else role = /^(?:Officer )?Ellis:/.test(match[0]) ? 'player' : 'npc';
            cursor = match.index + match[0].length;
        }
        push(text.slice(cursor), role);
        if (node.dialogueType === 'question' && node.dialogueID === 1 && character.characterID !== 3) {
            pages.splice(0, pages.length, language === 'fi' ? 'Aloitat kuulustelun.' : 'You begin the interview.');
            speakers.splice(0, speakers.length, 'scene');
        }
        node.dialogueText = pages.join('\n');
        node.dialogueSpeakers = speakers;
    }
    return project;
}
module.exports = {structureExampleSpeakers};
