"""Extract structural defaults only; no artwork or gameplay is copied.

Usage: python tools/build-construct-template.py path/to/reference.c3p
The generated JS allows exports even when index.html is opened via file://.
"""
import json
import pathlib
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    def read(name):
        return json.loads(archive.read(name))

    project = read('project.c3proj')
    project.update(name='Dialogue Playground', uniqueId='gdmplayground',
                   useWorker='dom', viewportWidth=960, viewportHeight=640,
                   firstLayout=None, containers=[])
    project['usedAddons'] = [a for a in project['usedAddons']
                             if a['type'] == 'plugin' and a['id'] in ('Sprite', 'Text', 'Keyboard')]
    for key in ('objectTypes', 'families', 'layouts', 'eventSheets', 'timelines'):
        project[key] = {'items': [], 'subfolders': []}
    for key in project['rootFileFolders']:
        project['rootFileFolders'][key] = {'items': [], 'subfolders': []}
    project['properties'].update(fullscreenMode='letterbox-scale', pixelRounding=False,
                                 loaderStyle='none', sampling='linear')
    layout = read('layouts/Layout 1.json')
    layer = layout['layers'][0]
    sprite_instance = next(i for i in layer['instances'] if i['type'] == 'Mike')
    sprite_instance.update(instanceVariables={}, behaviors={})
    text_instance = next(i for i in layer['instances'] if i['type'] == 'TextDialogue')
    text_instance['properties'].update(font='Arial', size=16, **{'enable-bbcode': False, 'vertical-alignment': 'top'})
    layer.update(name='Characters', instances=[], backgroundColor=[0.07, 0.09, 0.14, 1], renderingMode='2d')
    layout.update(name='Dialogue Playground', width=960, height=640,
                  eventSheet='Dialogue events', **{'nonworld-instances': []})
    sprite = read('objectTypes/Mike.json')
    frame = sprite['animations']['items'][0]['frames'][0]
    frame.update(width=32, height=32, useCollisionPoly=False)
    template = dict(project=project, layout=layout, sprite=sprite,
                    spriteInstance=sprite_instance, text=read('objectTypes/TextDialogue.json'),
                    textInstance=text_instance, keyboard=read('objectTypes/Keyboard.json'))
    output = pathlib.Path(__file__).resolve().parents[1] / 'js/constructTemplate.js'
    output.write_text('// Structural defaults derived from the supplied Construct r327 project.\n'
                      'const constructTemplate = ' + json.dumps(template, indent=2) + ';\n'
                      'if (typeof module !== "undefined") module.exports = constructTemplate;\n', encoding='utf-8')
