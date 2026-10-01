/* Construct's editable presentation and gameplay. Only the bridge below is serialized as JavaScript. */
function startConstructNativeDialogue(runtime, project, createSession, bindings = project.constructVariables || []) {
    const sessions = new Map();
    const g = runtime.globalVars;
    const answers = runtime.objects.Answers.getFirstInstance();
    answers.setSize(0, 2, 1);
    const variables = Object.create(null);
    if (!Array.isArray(bindings)) throw new Error('construct-bindings.json must contain a variables array.');
    if (bindings.some(item => !item || typeof item.dialogueName !== 'string' || typeof item.name !== 'string' || !item.name))
        throw new Error('Each construct-bindings.json entry needs dialogueName and name strings.');
    const required = new Map();
    const requireVariable = (name, type) => {
        if (!['number','string'].includes(type)) throw new Error(`Dialogue variable "${name}" must be a number or text.`);
        if (required.has(name) && required.get(name) !== type) throw new Error(`Dialogue variable "${name}" is used as both number and text.`);
        required.set(name, type);
    };
    for (const [name, definition] of Object.entries(project.gameIntegration?.variables || {}))
        requireVariable(name, definition.type === 'text' ? 'string' : definition.type);
    for (const character of project.characters) {
        character.dialogueNodes ||= [];
        character.outgoingLines ||= [];
        for (const node of [character, ...character.dialogueNodes]) {
            node.outgoingLines ||= [];
            for (const edge of node.outgoingLines) for (const condition of edge.transitionConditions || [])
                requireVariable(condition.variableName, typeof condition.variableValue);
        }
    }
    const reserved = new Set(['DialogueReady','DialogueActive','ScrollOffset','ScrollLimit','AnswerY','PageHeight',
        'SpeakerName','LineText','AnswerSpeaker','CurrentCharacter','CurrentNode','DialogueOutcome','LoadError'].map(name=>name.toLowerCase()));
    for (const [dialogueName, type] of required) {
        const binding = bindings.find(item=>item.dialogueName === dialogueName);
        const name = binding?.name || dialogueName;
        if (!binding && (reserved.has(name.toLowerCase()) || bindings.some(item=>item.name.toLowerCase() === name.toLowerCase())))
            throw new Error(`Add an explicit binding for "${dialogueName}" in construct-bindings.json; that global name is already reserved.`);
        if (!(name in g)) throw new Error(`Dialogue variable "${dialogueName}" needs a Construct global "${name}" (${type}). Add it in your event sheet, or change its name in construct-bindings.json.`);
        if (typeof g[name] !== type) throw new Error(`Construct global "${name}" must be ${type} for dialogue variable "${dialogueName}".`);
        Object.defineProperty(variables, dialogueName, {get: () => g[name]});
    }
    let character = null, session = null, page = 0, lastInputTick = -1;
    let pagedNode = null, textPages = [], pageLayout = '';
    // Measure with Construct's own Text renderer, using the developer's font and wrapping.
    // Events own the available width/height; this bridge only divides the dialogue content.
    const pages = () => {
        const text = runtime.objects.DialogueText.getFirstInstance();
        const height = Math.max(1, g.PageHeight);
        const key = JSON.stringify([text.width,height,text.fontFace,text.sizePt,text.isBold,text.isItalic,text.lineHeight,text.wordWrapMode]);
        if (pagedNode === session.current && pageLayout === key) return textPages;
        const anchor = pagedNode === session.current ? textPages[page] : null;
        pagedNode = session.current;
        pageLayout = key;
        textPages = [];
        const previous = text.text;
        try {
            String(pagedNode?.dialogueText || '').split(/\r?\n/).forEach((paragraph, sourceLine) => {
                const chars = Array.from(paragraph);
                let start = 0;
                do {
                    let low = 1, high = chars.length - start, length = 0;
                    while (low <= high) {
                        const middle = Math.floor((low + high) / 2);
                        text.text = chars.slice(start, start + middle).join('');
                        if (text.textHeight <= height) { length = middle; low = middle + 1; }
                        else high = middle - 1;
                    }
                    // Always advance, even if a chosen font cannot fit a single line.
                    length = Math.max(1, length);
                    if (start + length < chars.length && text.wordWrapMode === 'word') {
                        const boundary = chars.slice(start, start + length).join('').search(/\s+\S*$/u);
                        if (boundary > 0) length = Array.from(chars.slice(start, start + length).join('').slice(0, boundary)).length;
                    }
                    textPages.push({text:chars.slice(start,start+length).join(''),sourceLine,offset:start});
                    start += length;
                    while (start < chars.length && /\s/u.test(chars[start])) start++;
                } while (start < chars.length);
            });
        } finally { text.text = previous; }
        page = 0;
        if (anchor) {
            for (let i = 0; i < textPages.length; i++) {
                const item = textPages[i];
                if (item.sourceLine < anchor.sourceLine || (item.sourceLine === anchor.sourceLine && item.offset <= anchor.offset)) page = i;
            }
        }
        return textPages;
    };
    const closeChoice = () => [{text:'Close', enabled:true, choose:() => api.close()}];
    const choices = () => {
        const node = session.current;
        if (!node) return closeChoice();
        const count = pages().length;
        if (page < count - 1) return [{text:'Continue', enabled:true, choose:() => { page++; }}];
        const options = session.options();
        const hasNext = node.outgoingLines.length || character.dialogueNodes.some(n => String(n.dialogueID) === String(node.nextNode));
        if (!options.some(option => option.enabled) || (!['question','fight'].includes(node.dialogueType) && !hasNext)) return closeChoice();
        return options;
    };
    function refresh() {
        if (!session) return;
        const node = session.current;
        const role = node?.dialogueSpeakers?.[pages()[page].sourceLine] || (node?.dialogueType === 'answer' ? 'player' : 'npc');
        g.SpeakerName = role === 'player' ? 'You' : role === 'scene' ? 'Scene' : character.characterName;
        g.LineText = node ? pages()[page].text : 'No dialogue available right now.';
        g.CurrentNode = node ? String(node.dialogueID) : '';
        g.DialogueOutcome = node?.trainingOutcome || '';
        g.AnswerSpeaker = node?.dialogueType === 'question' && page === pages().length - 1 ? 'You' : '';
        const options = choices();
        if (answers.width !== options.length) answers.setSize(options.length, 2, 1);
        options.forEach((option, index) => {
            answers.setAt(option.text, index, 0);
            answers.setAt(option.enabled ? 1 : 0, index, 1);
        });
    }
    const api = {
        start(id) {
            if (g.DialogueActive) return;
            character = project.characters.find(c => String(c.characterID) === String(id));
            if (!character) return;
            if (!sessions.has(character)) sessions.set(character, createSession(character, variables));
            session = sessions.get(character); session.start(); page = 0; pagedNode = null;
            g.CurrentCharacter = String(character.characterID);
            g.DialogueActive = 1; g.ScrollOffset = 0; refresh();
        },
        choose(index) {
            if (!session || lastInputTick === runtime.tickCount) return;
            const option = choices()[index - 1];
            if (!option?.enabled) { refresh(); return; }
            lastInputTick = runtime.tickCount;
            const wasPage = session.current && page < pages().length - 1;
            option.choose();
            if (!session) return; // Close uses the same path as the Escape event.
            if (!wasPage) page = 0;
            g.ScrollOffset = 0;
            if (session.current) refresh(); else if (g.CurrentNode === '') refresh(); else api.close();
        },
        close() { session = null; g.DialogueActive = 0; answers.setSize(0, 2, 1); },
        refresh
    };
    globalThis.dialogue = api;
    g.LoadError = '';
    g.DialogueReady = 1;
    return api;
}

function buildConstructNativeEvents(ctx) {
    const {data, npcNames, base, project, layout, addType, addSprite, nextUid, nextSid} = ctx;
    const clone = x => JSON.parse(JSON.stringify(x));
    const q = x => '"' + String(x).replace(/"/g, '""') + '"';
    const ace = (objectClass, id, parameters = {}) => ({objectClass, id, parameters, sid:nextSid()});
    const block = (conditions, actions, children) => ({eventType:'block', conditions, actions, ...(children ? {children} : {}), sid:nextSid()});
    const orBlock = (conditions, actions, children) => ({...block(conditions, actions, children), isOrBlock:true});
    const group = (title, description, children) => ({eventType:'group', title, description, disabled:false, isActiveOnStart:true, children, sid:nextSid()});
    const comment = text => ({eventType:'comment', text});
    const set = (variable, value) => ace('System','set-eventvar-value',{variable,value:String(value)});
    const cmp = (variable, value, comparison = 0) => ace('System','compare-eventvar',{variable, comparison, value:String(value)});
    const script = code => ({type:'script', language:'javascript', script:[code]});
    const call = (name, ...parameters) => ({callFunction:name, parameters, sid:nextSid()});
    const globals = [];
    // Initial values are literal data; only event expressions use Construct quoting.
    const variable = (name, value, description = '') => globals.push({eventType:'variable', name, type:typeof value === 'number' ? 'number' : 'string', initialValue:String(value), comment:description, isStatic:false, isConstant:false, sid:nextSid()});
    for (const name of ['DialogueReady','DialogueActive','ScrollOffset','ScrollLimit','AnswerY']) variable(name,0);
    variable('PageHeight',100,'Calculated by Dialogue layout. Available height for each portion of dialogue.');
    for (const name of ['SpeakerName','LineText','AnswerSpeaker','CurrentCharacter','CurrentNode','DialogueOutcome','LoadError']) variable(name,'');
    addType({name:'Answers','plugin-id':'Arr',sid:0,isGlobal:true,instanceVariables:[]});
    layout['nonworld-instances'].push({type:'Answers',properties:{width:0,height:2,depth:1},uid:nextUid(),instanceVariables:{}});
    project.usedAddons.push({type:'plugin',id:'Arr',name:'Array',author:'Scirra',bundled:false});
    const mouse = {name:'Mouse','plugin-id':'Mouse',sid:0,'singleglobal-inst':{type:'Mouse',properties:{},uid:nextUid()}};
    addType(mouse);
    project.usedAddons.push({type:'plugin',id:'Mouse',name:'Mouse',author:'Scirra',bundled:false});
    const hud = clone(layout.layers[0]);
    Object.assign(hud,{name:'Dialogue UI',instances:[],isInitiallyVisible:false,parallaxX:0,parallaxY:0,isTransparent:true,forceOwnTexture:false});
    layout.layers.push(hud);
    const panelSprite = (name,x,y,width,height,blendMode='normal') => {
        addSprite(name,x,y,[0,0,0,1],name === 'DialoguePanel' ? {HeightPercent:48,MarginPercent:2,PaddingPercent:2,GapPercent:1} : {});
        const instance=layout.layers[0].instances.pop();
        Object.assign(instance.world,{width,height,blendMode});
        instance.properties['enable-collisions']=false;
        hud.instances.push(instance);
    };
    panelSprite('DialoguePanel',480,472,912,304);
    const text = (name, content, x, y, width, height, size=16, color=[1,1,1,1], layer=hud) => {
        const type = clone(base.text); type.name=name;
        if (['Answer','AnswerNumber'].includes(name)) type.instanceVariables=[{name:'Index',type:'number',desc:'Zero-based index in Answers.',show:true,sid:0}];
        addType(type);
        const instance = clone(base.textInstance); instance.type=name; instance.uid=nextUid();
        Object.assign(instance.properties,{text:content,size,color,'horizontal-alignment':'left'});
        if (['Answer','AnswerNumber'].includes(name)) instance.instanceVariables={Index:0};
        Object.assign(instance.world,{x,y,width,height}); layer.instances.push(instance);
    };
    text('GameInstructions','Move: arrow keys. Touch an NPC to talk. Answers: 1–9 or click. Esc / arrow keys: close. Scroll: mouse wheel.',24,20,910,65,16,[.7,.8,.9,1],layout.layers[0]);
    text('DialogueSpeaker','Speaker',48,332,700,28,20,[.6,.85,1,1]);
    text('DialogueText','Dialogue text',48,374,860,72);
    text('AnswersSpeaker','You',48,458,860,24,16,[.6,.85,1,1]);
    text('Answer','Answer text',80,494,820,40);
    text('AnswerNumber','1',48,494,28,24,14,[.45,.5,.6,1]);
    panelSprite('DialogueHeader',480,344,912,48);
    text('DialogueClose','Close (Esc)',770,334,150,28,16,[.6,.85,1,1]);
    const viewport = dimension => `Viewport${dimension}("Dialogue UI")`;
    const left = 'DialoguePanel.X - DialoguePanel.Width / 2';
    const right = 'DialoguePanel.X + DialoguePanel.Width / 2';
    const top = 'DialoguePanel.Y - DialoguePanel.Height / 2';
    const bottom = 'DialoguePanel.Y + DialoguePanel.Height / 2';
    const padding = 'max(1, round(DialoguePanel.Width * clamp(DialoguePanel.PaddingPercent, 0, 10) / 100))';
    const gap = 'max(1, round(DialoguePanel.Height * clamp(DialoguePanel.GapPercent, 0, 10) / 100))';
    const contentTop = 'DialogueHeader.Y + DialogueHeader.Height / 2';
    const contentBottom = `${bottom} - ${padding}`;
    const innerWidth = `max(1, DialoguePanel.Width - 2 * ${padding})`;
    const position = (object,x,y) => ace(object,'set-position',{x,y});
    const width = (object,value) => ace(object,'set-width',{width:`round(${value})`});
    const height = (object,value) => ace(object,'set-height',{height:`ceil(${value})`});
    const layoutEvents = group('Dialogue layout','Select DialoguePanel to change HeightPercent, MarginPercent, PaddingPercent and GapPercent. Fonts stay editable on native Text objects. All dimensions below use the current viewport and panel.',[
        block([ace('System','every-tick')],[
            width('DialoguePanel',`max(1, round(${viewport('Width')} * (1 - 2 * clamp(DialoguePanel.MarginPercent, 0, 20) / 100)))`),
            height('DialoguePanel',`max(1, round(${viewport('Height')} * clamp(DialoguePanel.HeightPercent, 10, 100 - 2 * clamp(DialoguePanel.MarginPercent, 0, 20)) / 100))`),
            position('DialoguePanel',`round(${viewport('Left')} + (${viewport('Width')} - DialoguePanel.Width) / 2) + DialoguePanel.Width / 2`,`round(${viewport('Bottom')} - ${viewport('Height')} * clamp(DialoguePanel.MarginPercent, 0, 20) / 100) - DialoguePanel.Height / 2`),
            width('DialogueClose',`max(1, (${innerWidth}) * 0.3)`),
            width('DialogueSpeaker',`max(1, (${innerWidth}) * 0.7 - ${gap})`),
            height('DialogueClose',`max(1, DialogueClose.TextHeight + ${gap})`),
            height('DialogueSpeaker',`max(1, DialogueSpeaker.TextHeight + ${gap})`),
            position('DialogueSpeaker',`${left} + ${padding}`,`${top} + ${padding}`),
            position('DialogueClose',`${right} - ${padding} - DialogueClose.Width`,`${top} + ${padding}`),
            width('DialogueHeader','DialoguePanel.Width'),
            height('DialogueHeader',`max(DialogueSpeaker.Height, DialogueClose.Height) + 2 * ${padding}`),
            position('DialogueHeader','DialoguePanel.X',`${top} + DialogueHeader.Height / 2`),
            width('DialogueText',innerWidth),width('AnswersSpeaker',innerWidth),
            ace('DialogueText','set-x',{x:`${left} + ${padding}`}),
            ace('AnswersSpeaker','set-x',{x:`${left} + ${padding}`}),
            height('AnswersSpeaker',`AnswerSpeaker = "" ? 0 : AnswersSpeaker.TextHeight + ${gap}`),
            set('PageHeight',`max(1, floor((${contentBottom} - (${contentTop}) - 3 * ${gap}) * 0.55))`),
            set('ScrollOffset','clamp(ScrollOffset, 0, ScrollLimit)')
        ])
    ]);
    const fn = (name, param, type, code) => ({eventType:'function-block',functionName:name,functionDescription:'Public integration point. Call this from your own game events.',functionCategory:'Dialogue',functionReturnType:'none',functionCopyPicked:false,functionIsAsync:false,functionParameters:param ? [{name:param,type,initialValue:type==='number' ? '1' : '',comment:'',sid:nextSid()}] : [],conditions:[],actions:[script(code)],sid:nextSid()});
    const integration = group('Dialogue API','Use these functions from your own events. Answers.At(index, 0) is text; Answers.At(index, 1) is enabled (1 or 0). Answers.Width is the answer count.',[
        fn('StartDialogue','CharacterID','string','globalThis.dialogue?.start(localVars.CharacterID);'),
        fn('ChooseAnswer','Selection','number','globalThis.dialogue?.choose(localVars.Selection);'),
        fn('CloseDialogue',null,null,'globalThis.dialogue?.close();'),
        block([ace('System','every-tick'),cmp('DialogueActive',1)],[script('globalThis.dialogue?.refresh();')])
    ]);
    const movementAction = (id,parameters={}) => ({...ace('Player',id,parameters),behaviorType:'Movement'});
    const world = group('Demo movement and interactions','Replace these native events with your own movement and interaction rules.',[
        block([cmp('DialogueActive',0)],[movementAction('set-enabled',{state:'enabled'})]),
        block([cmp('DialogueActive',1)],[movementAction('stop'),movementAction('set-enabled',{state:'disabled'})]),
        block([ace('System','every-tick')],[ace('Player','set-position',{x:'clamp(Player.X, 16, LayoutWidth - 16)',y:'clamp(Player.Y, 16, LayoutHeight - 16)'}),ace('PlayerLabel','set-position',{x:'Player.X - 85',y:'Player.Y - 44'})]),
        ...data.characters.flatMap((c,i)=>{
            const npc=npcNames[i];
            const touching=value=>ace(npc,'set-instvar-value',{'instance-variable':'Touching',value:String(value)});
            return [
                block([{...ace('Player','is-overlapping-another-object',{object:npc}),isInverted:true}],[touching(0)]),
                block([ace('Player','is-overlapping-another-object',{object:npc}),ace(npc,'compare-instance-variable',{'instance-variable':'Touching',comparison:0,value:'0'})],[touching(1)],[
                    block([cmp('DialogueActive',0),cmp('DialogueReady',1)],[call('StartDialogue',q(c.characterID))])
                ])
            ];
        }),
        ...(data.demoAppleQuest ? [block([ace('Player','on-collision-with-another-object',{object:'Apple'})],[set(data.constructVariables.find(v=>v.dialogueName==='hasApple').name,1),ace('Apple','destroy')])] : [])
    ]);
    const compare = (left,right,comparison=0) => ace('System','compare-two-values',{'first-value':left,comparison,'second-value':right});
    const create = object => ace('System','create-object',{'object-to-create':object,layer:q('Dialogue UI'),x:'DialoguePanel.X',y:'DialoguePanel.Y','create-hierarchy':false,'template-name':'""'});
    const index = object => ace(object,'set-instvar-value',{'instance-variable':'Index',value:'loopindex'});
    const render = [
        block([cmp('LoadError','""',1)],[ace('GameInstructions','set-text',{text:'"Dialogue could not load: " & LoadError'})]),
        block([compare('Answer.Count','Answers.Width',1)],[ace('Answer','destroy'),ace('AnswerNumber','destroy')],[
            block([ace('System','repeat',{count:'Answers.Width'})],[create('Answer'),index('Answer'),create('AnswerNumber'),index('AnswerNumber')])
        ]),
        block([cmp('DialogueActive',0)],[ace('System','set-layer-visible',{layer:q('Dialogue UI'),visibility:'invisible'})]),
        block([cmp('DialogueActive',1)],[ace('System','set-layer-visible',{layer:q('Dialogue UI'),visibility:'visible'}),
            ace('DialogueHeader','move-to-top'),ace('DialogueSpeaker','move-to-top'),ace('DialogueClose','move-to-top'),
            ace('DialogueSpeaker','set-text',{text:'SpeakerName'}),ace('DialogueText','set-text',{text:'LineText'}),ace('AnswersSpeaker','set-text',{text:'AnswerSpeaker'}),
            ace('DialogueText','set-y',{y:`${contentTop} + ${gap} - ScrollOffset`}),height('DialogueText',`max(1, DialogueText.TextHeight + ${gap})`),
            ace('AnswersSpeaker','set-y',{y:`DialogueText.Y + DialogueText.Height + ${gap}`}),
            set('AnswerY',`AnswersSpeaker.Y + AnswersSpeaker.Height + ${gap}`),set('ScrollLimit',`max(0, AnswerY + ScrollOffset - (${contentBottom}))`)],[
            block([ace('System','for-each-ordered',{object:'Answer',expression:'Answer.Index',order:'ascending'})],[
                ace('Answer','set-text',{text:'Answers.At(Answer.Index, 0)'}),
                width('Answer',`max(1, (${innerWidth}) - 2 * ${padding})`),
                ace('Answer','set-x',{x:`${left} + 3 * ${padding}`}),
                height('Answer',`max(1, Answer.TextHeight + 2 * ${gap})`),
                ace('Answer','set-y',{y:'AnswerY'}),
                ace('Answer','set-opacity',{opacity:'35 + 65 * Answers.At(Answer.Index, 1)'}),
                set('AnswerY',`AnswerY + Answer.Height + ${gap}`),
                set('ScrollLimit',`max(0, AnswerY + ScrollOffset - (${contentBottom}))`)
            ],[
                block([ace('AnswerNumber','compare-instance-variable',{'instance-variable':'Index',comparison:0,value:'Answer.Index'})],[
                    ace('AnswerNumber','set-y',{y:'Answer.Y'}),
                    ace('AnswerNumber','set-x',{x:`${left} + ${padding}`}),
                    width('AnswerNumber',`2 * ${padding}`),height('AnswerNumber','Answer.Height'),
                    ace('AnswerNumber','set-text',{text:'Answer.Index < 9 ? str(Answer.Index + 1) : ""'})
                ])
            ])
        ])
    ];
    const click = object => ace('Mouse','on-object-clicked',{'mouse-button':'left','click-type':'clicked','object-clicked':object});
    const key = code => ace('Keyboard','on-key-pressed',{key:code});
    const inputs = [block([cmp('DialogueActive',1)],[],[
        // Both keyboard ranges share one dispatch. Mouse keeps Construct's picked Answer instance.
        block([ace('Keyboard','on-any-key-pressed')],[],[
            orBlock([[49,57],[97,105]].map(([min,max])=>ace('System','is-between-values',{
                value:'Keyboard.LastKeyCode','lower-bound':String(min),'upper-bound':String(max)
            })),[call('ChooseAnswer','Keyboard.LastKeyCode >= 97 ? Keyboard.LastKeyCode - 96 : Keyboard.LastKeyCode - 48')])
        ]),
        block([click('Answer'),ace('System','is-between-values',{value:'Mouse.Y("Dialogue UI")','lower-bound':contentTop,'upper-bound':bottom}),ace('System','is-between-values',{value:'Mouse.X("Dialogue UI")','lower-bound':left,'upper-bound':right})],[call('ChooseAnswer','Answer.Index + 1')]),
        orBlock([key(27),...[37,38,39,40].map(key),click('DialogueClose')],[call('CloseDialogue')]),
        ...[['up',-1],['down',1]].map(([direction,sign])=>
            block([ace('Mouse','on-mouse-wheel',{direction})],
                [set('ScrollOffset',`clamp(ScrollOffset + ${sign} * DialoguePanel.Height / 2, 0, ScrollLimit)`)]))
    ])];
    return [comment('NATIVE CONSTRUCT DIALOGUE — edit the Dialogue UI layer for fonts, colours and layout. Game variables above are yours; dialogue state below and the Answers array connect your events to the dialogue. Disable demo groups when integrating into your game.'),...globals,layoutEvents,integration,world,
        group('Dialogue presentation','Native Text objects only. Edit these layout events to control spacing and scrolling. TextHeight settles after Construct renders the text.',render),
        group('Dialogue input','One active-dialogue guard. OR blocks combine keyboard ranges and close controls. Mouse chooses the clicked answer; the wheel scrolls long conversations.',inputs)];
}

if (typeof module !== 'undefined') module.exports = {startConstructNativeDialogue, buildConstructNativeEvents};

