const exportFormatStorageKey = 'gameDialogueMaker.defaultExportFormat';

function isSupportedExportFormat(value) {
    return Array.from(document.querySelectorAll('#exportTarget option')).some(option => option.value === value);
}

function saveDefaultExportFormat(value) {
    if (!isSupportedExportFormat(value)) return;
    // Private/file browsing can deny storage; the current-page setting still works.
    try { localStorage.setItem(exportFormatStorageKey, value); } catch (_) { /* Keep the in-page preference. */ }
}

function updateExportInfo(dialog) {
    const target = dialog.querySelector('[name="exportTarget"]').value;
    for (const info of dialog.querySelectorAll('[data-export-info]')) info.hidden = info.dataset.exportInfo !== target;
    const names = {json:'JSON',plainText:'plain text',construct:'Construct (.c3p)',godot:'Godot (.zip)',
        unity:'Unity (.zip)',unreal:'Unreal Engine (.zip)',gamemaker:'GameMaker (.zip)',gdevelop:'GDevelop (.zip)'};
    dialog.querySelector('[type="submit"]').textContent = `Download ${names[target] || 'export'}`;
}

function openExportDialog() {
    const dialog = document.getElementById('exportDialog');
    const selected = document.querySelector('#formatSelection input[name="format"]:checked')?.value;
    const target = isSupportedExportFormat(selected) ? selected : 'json';
    dialog.querySelector('[name="exportTarget"]').value = target;
    saveDefaultExportFormat(target);
    dialog.querySelector('[role="alert"]').textContent = '';
    updateExportInfo(dialog);
    dialog.showModal();
}

document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('exportDialog');
    let saved;
    try { saved = localStorage.getItem(exportFormatStorageKey); } catch (_) { /* Storage is optional. */ }
    const settings = document.getElementById('formatSelection');
    if (isSupportedExportFormat(saved)) {
        for (const input of settings.querySelectorAll('input[name="format"]')) input.checked = input.value === saved;
    }
    settings.addEventListener('change', event => {
        if (event.target.name === 'format' && event.target.checked) saveDefaultExportFormat(event.target.value);
    });
    settings.addEventListener('submit', event => event.preventDefault());
    dialog.querySelector('[name="exportTarget"]').addEventListener('change', () => {
        dialog.querySelector('[role="alert"]').textContent = '';
        updateExportInfo(dialog);
    });
    dialog.querySelector('[data-close-export]').addEventListener('click', () => dialog.close());
    dialog.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        try {
            const target = dialog.querySelector('[name="exportTarget"]').value;
            if (target === 'construct') exportConstruct();
            else if (target === 'godot') exportGodot();
            else if (target === 'unity') exportUnity();
            else if (target === 'unreal') exportUnreal();
            else if (target === 'gamemaker') exportGameMaker();
            else if (target === 'gdevelop') exportGDevelop();
            else if (target === 'plainText') exportDialogueToText(gameDialogueMakerProject);
            else if (target === 'json') exportJson();
            else throw new Error('Choose a supported export format.');
            dialog.close();
        } catch (error) {
            dialog.querySelector('[role="alert"]').textContent = error.message || 'Export failed. Please try again.';
        }
    });
    // Keep the editor's shortcuts from handling keys while choosing an export.
    dialog.addEventListener('keydown', event => event.stopPropagation());
});
