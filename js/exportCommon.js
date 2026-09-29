// Shared data validation, serialization and ZIP download helpers.
// Original 32px pixel apple, drawn from simple ellipses: red fruit and green leaves.
function createDemoApplePng() {
    return Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAjElEQVR4nGNgGAWjAA/Q2xfwnxAu91YmqAYZU90B5OCh4wBCgNTgp4kDaJoGiHUACFPV4EHngOc2Bv+xYWQH4FJDE4vJwWRb/n9yLRzTzRHImqjpAKIdMaAOQNdAbQcQdMSoAwadA2iBRx0w6gC8DqC1IwhaPigcQCtHEG05LRxBsuXEOoQY+VGADwAA4BLCA+gUeZgAAAAASUVORK5CYII='), c => c.charCodeAt(0));
}
function cleanDialogueProject(project) {
    const transient = new Set(['nodeElement', 'nextNodeLineElem', 'lineElem']);
    return JSON.parse(JSON.stringify(project, (key, value) => transient.has(key) ? undefined : value));
}

function validateDialogueProject(project) {
    if (!Array.isArray(project.characters) || !project.characters.length) throw new Error('Add at least one character before exporting.');
    for (const character of project.characters) {
        const name = character.characterName || 'Unnamed character';
        const nodes = character.dialogueNodes || [];
        const ids = new Set();
        for (const node of nodes) {
            const id = String(node.dialogueID);
            if (!Number.isInteger(Number(id)) || Number(id) <= 0 || ids.has(id)) throw new Error(`${name}: dialogue IDs must be unique positive numbers (${id}).`);
            ids.add(id);
            if (!['line', 'question', 'answer', 'fight'].includes(node.dialogueType)) throw new Error(`${name}: unsupported node type ${node.dialogueType}.`);
        }
        for (const node of [character, ...nodes]) {
            for (const line of node.outgoingLines || []) {
                if (!ids.has(String(line.toNode))) throw new Error(`${name}: a connection points to missing dialogue ${line.toNode}.`);
                for (const condition of line.transitionConditions || []) {
                    if (!condition.variableName || !['=', '!=', '<', '>', '<=', '>='].includes(condition.comparisonOperator)) {
                        throw new Error(`${name}: a connection has an invalid condition.`);
                    }
                }
            }
            if (Number(node.nextNode) > 0 && !ids.has(String(node.nextNode))) throw new Error(`${name}: Next points to missing dialogue ${node.nextNode}.`);
        }
        if (nodes.length && !(character.outgoingLines || []).length) throw new Error(`${name}: connect the character root to a starting dialogue.`);
    }
}

// Standard ZIP with stored entries for C3P and Godot folder projects.
// This keeps downloads dependency-free and file:// safe.
function createExportZip(files) {
    const encoder = new TextEncoder();
    const chunks = [], central = [];
    let offset = 0;
    const header = size => ({ bytes: new Uint8Array(size), view: null });
    const crc32 = bytes => {
        let crc = -1;
        for (const byte of bytes) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
        return (crc ^ -1) >>> 0;
    };
    for (const [path, value] of Object.entries(files)) {
        const name = encoder.encode(path);
        const data = typeof value === 'string' ? encoder.encode(value) : value;
        const crc = crc32(data);
        const local = header(30); local.view = new DataView(local.bytes.buffer);
        const a = local.view;
        a.setUint32(0, 0x04034b50, true); a.setUint16(4, 20, true); a.setUint16(6, 0x800, true);
        a.setUint16(12, 33, true); a.setUint32(14, crc, true);
        a.setUint32(18, data.length, true); a.setUint32(22, data.length, true); a.setUint16(26, name.length, true);
        chunks.push(local.bytes, name, data);
        const entry = header(46); entry.view = new DataView(entry.bytes.buffer);
        const b = entry.view;
        b.setUint32(0, 0x02014b50, true); b.setUint16(4, 20, true); b.setUint16(6, 20, true); b.setUint16(8, 0x800, true);
        b.setUint16(14, 33, true); b.setUint32(16, crc, true);
        b.setUint32(20, data.length, true); b.setUint32(24, data.length, true); b.setUint16(28, name.length, true); b.setUint32(42, offset, true);
        central.push(entry.bytes, name);
        offset += local.bytes.length + name.length + data.length;
    }
    const size = central.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, central.length / 2, true); e.setUint16(10, central.length / 2, true);
    e.setUint32(12, size, true); e.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

function downloadDialogueBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}


if (typeof module !== 'undefined') module.exports = { createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };
