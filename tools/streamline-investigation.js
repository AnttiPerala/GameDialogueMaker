// Restructure authored examples only. Keep branch-specific replies, but show the
// next question's choices on that reply instead of a separate Continue screen.
function streamlineInvestigation(project) {
    for (const character of project.characters) {
        const originals = new Map(character.dialogueNodes.map(node => [node.dialogueID, structuredClone(node)]));
        const join = nodes => {
            const pages = [], speakers = [];
            for (const node of nodes) String(node.dialogueText || '').split(/\r?\n/).forEach((text, index) => {
                if (!text.trim()) return;
                const role = node.dialogueSpeakers?.[index] || 'npc';
                if (speakers.at(-1) === role) pages[pages.length - 1] += ' ' + text.trim();
                else { pages.push(text.trim()); speakers.push(role); }
            });
            return {dialogueText:pages.join('\n'), dialogueSpeakers:speakers};
        };
        for (const node of character.dialogueNodes) {
            if (node.dialogueType !== 'line') continue;
            const chain = [originals.get(node.dialogueID)], visited = new Set([node.dialogueID]);
            let last = chain[0];
            while (last.dialogueType === 'line' && last.outgoingLines.length === 1 && !last.outgoingLines[0].transitionConditions?.length) {
                const next = originals.get(last.outgoingLines[0].toNode);
                if (!next || visited.has(next.dialogueID) || !['line', 'question'].includes(next.dialogueType)) break;
                // Keep real conclusion screens as separate, meaningful endings.
                if (next.dialogueType === 'line' && !next.outgoingLines.length) break;
                visited.add(next.dialogueID); chain.push(next); last = next;
            }
            if (last.dialogueType !== 'question') continue;
            Object.assign(node, join(chain), {dialogueType:'question', outgoingSockets:last.outgoingSockets,
                outgoingLines:last.outgoingLines.map(edge=>({...structuredClone(edge), fromNode:node.dialogueID})), nextNode:-1});
        }
        const byId = new Map(character.dialogueNodes.map(n=>[n.dialogueID,n]));
        const seen = new Set(), queue = character.outgoingLines.map(e=>e.toNode);
        while (queue.length) {
            const id = queue.pop(); if (seen.has(id)) continue;
            seen.add(id); const node = byId.get(id);
            queue.push(...node.outgoingLines.map(e=>e.toNode));
            if (node.nextNode > 0) queue.push(node.nextNode);
        }
        character.dialogueNodes = character.dialogueNodes.filter(n=>seen.has(n.dialogueID));
    }
    // The gate now appears on each incoming reply, with the same conditioned
    // answer edges. Point integration guidance at the main route's new gate.
    const checkpoint = project.gameIntegration?.evidenceCheckpoint;
    if (checkpoint) {
        const character = project.characters.find(c=>c.characterID===checkpoint.characterID);
        const {createConstructDialogueSession} = require('../js/constructRuntime');
        const state = createConstructDialogueSession(character, {cabinetRecordChecked:0});
        state.start(); const visited = new Set();
        while (state.current && !visited.has(state.current.dialogueID)) {
            visited.add(state.current.dialogueID);
            const option = state.options()[0];
            if (!option?.enabled) { checkpoint.dialogueID = state.current.dialogueID; break; }
            option.choose();
        }
    }
    return project;
}
module.exports = {streamlineInvestigation};
