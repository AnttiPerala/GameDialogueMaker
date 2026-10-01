using System;
using System.Collections.Generic;
using System.Globalization;
using UnityEngine;

namespace GameDialogueMakerUnity
{
    // Built-in Unity IMGUI keeps this starter independent of UI packages.
    public class DialogueController : MonoBehaviour
    {
        public TextAsset dialogueFile;
        public DialogueData Data { get; private set; }
        public readonly Dictionary<string, VariableValue> Variables = new Dictionary<string, VariableValue>();
        public bool IsBusy { get { return session != null || showVariables || error != null; } }
        readonly Dictionary<string, string> variableInputs = new Dictionary<string, string>();
        readonly Dictionary<int, DialogueSession> sessions = new Dictionary<int, DialogueSession>();
        DialogueSession session;
        DialogueNpc[] npcs;
        int page;
        bool showVariables;
        string error;
        bool appleCollected;
        Vector2 dialogueScroll, variableScroll;

        void Awake()
        {
            try
            {
                if (dialogueFile == null) throw new Exception("Assign the exported dialogue.json TextAsset.");
                Data = DialogueJson.Parse(dialogueFile.text);
                if (Data == null || Data.characters == null) throw new Exception("Invalid dialogue data.");
                foreach (CharacterData character in Data.characters)
                {
                    AddVariables(character.start);
                    foreach (NodeData node in character.nodes) AddVariables(node.edges);
                }
                npcs = GetComponentsInChildren<DialogueNpc>();
                foreach (DialogueNpc npc in npcs)
                {
                    if (!string.IsNullOrEmpty(npc.characterId)) npc.characterIndex = Array.FindIndex(Data.characters, c => c.id == npc.characterId);
                    if (npc.characterIndex >= 0 && npc.characterIndex < Data.characters.Length)
                        npc.displayName = Data.characters[npc.characterIndex].name;
                }
            }
            catch (Exception exception) { error = exception.Message; Debug.LogError(error, this); }
        }

        void AddVariables(EdgeData[] edges)
        {
            foreach (EdgeData edge in edges)
                foreach (ConditionData condition in edge.conditions)
                    if (!Variables.ContainsKey(condition.name))
                    {
                        Variables.Add(condition.name, condition.kind == "number" ? VariableValue.Numeric(0) : VariableValue.String(""));
                        variableInputs.Add(condition.name, condition.kind == "number" ? "0" : "");
                    }
        }

        void Update()
        {
            if (DialogueInput.ClosePressed()) { session = null; showVariables = false; return; }
            if (session == null || showVariables) return;
            if (DialogueInput.MovementPressed()) { session = null; return; }
            int index = DialogueInput.AnswerPressed();
            if (index < 0) return;
            if (session.Current == null) { if (index == 0) { session.Start(); page = 0; } return; }
            string[] pages = session.Current.text.Replace("\r\n", "\n").Split('\n');
            if (page < pages.Length - 1) { if (index == 0) { page++; dialogueScroll = Vector2.zero; } return; }
            var choices = session.Options();
            if (index < choices.Count && choices[index].Enabled) Choose(index);
        }

        public void CollectApple()
        {
            if (appleCollected) return;
            appleCollected = true;
            Variables["hasApple"] = VariableValue.Numeric(1);
            variableInputs["hasApple"] = "1";
        }

        public void OpenCharacterId(string characterId)
        {
            if (Data != null) OpenCharacter(Array.FindIndex(Data.characters, c => c.id == characterId));
        }

        public void OpenCharacter(int index)
        {
            if (IsBusy || Data == null || index < 0 || index >= Data.characters.Length) return;
            if (!sessions.TryGetValue(index, out session)) { session = new DialogueSession(Data.characters[index], Variables); sessions.Add(index, session); }
            session.Start();
            page = 0;
            dialogueScroll = Vector2.zero;
        }

        void Choose(int index)
        {
            session.Choose(index);
            page = 0;
            dialogueScroll = Vector2.zero;
            if (session.Current == null) session = null;
        }

        bool NumberedButton(string text, int index, GUIStyle style)
        {
            var answerStyle = new GUIStyle(style) { alignment = TextAnchor.MiddleLeft };
            answerStyle.padding.left = 36;
            bool clicked = GUILayout.Button(text, answerStyle, GUILayout.MinHeight(36));
            Rect rect = GUILayoutUtility.GetLastRect();
            var numberStyle = new GUIStyle(GUI.skin.label) { fontSize = 12, alignment = TextAnchor.MiddleLeft };
            Color previous = GUI.color;
            GUI.color = new Color(previous.r, previous.g, previous.b, previous.a * 0.45f);
            GUI.Label(new Rect(rect.x + 10, rect.y, 24, rect.height), (index + 1).ToString(), numberStyle);
            GUI.color = previous;
            return clicked;
        }

        void OnGUI()
        {
            var labelStyle = new GUIStyle(GUI.skin.label) { wordWrap = true, richText = false, fontSize = 16 };
            var buttonStyle = new GUIStyle(GUI.skin.button) { wordWrap = true, richText = false, fontSize = 16 };
            var titleStyle = new GUIStyle(labelStyle) { fontSize = 22, fontStyle = FontStyle.Bold };
            Action pendingAction = null;
            if (Camera.main != null && npcs != null)
                foreach (DialogueNpc npc in npcs)
                {
                    Vector3 point = Camera.main.WorldToScreenPoint(npc.transform.position + Vector3.down * 0.55f);
                    if (point.z > 0)
                        GUI.Label(new Rect(point.x - 90, Screen.height - point.y, 180, 58), npc.displayName,
                            new GUIStyle(labelStyle) { alignment = TextAnchor.UpperCenter });
                }

            GUILayout.BeginArea(new Rect(16, 16, Screen.width - 32, 90), GUI.skin.box);
            GUILayout.BeginHorizontal();
            GUILayout.Label(error ?? "Blue square = you | Move: arrows / WASD\nTouch an NPC to talk | Click answers | Esc: close", labelStyle);
            if (error == null && GUILayout.Button("Test variables", buttonStyle, GUILayout.Width(145), GUILayout.Height(48)))
                pendingAction = delegate { showVariables = !showVariables; };
            GUILayout.EndHorizontal();
            GUILayout.EndArea();

            if (Data != null && Data.demoAppleQuest)
                GUI.Label(new Rect(20, 106, Screen.width - 40, 30), appleCollected ? "Apple collected! Return to Mira." : "Apple: not collected. Talk to Mira, then touch the red apple.", labelStyle);

            if (session != null)
            {
                float width = Mathf.Min(800, Screen.width - 32);
                float height = Mathf.Min(340, Screen.height * 0.6f);
                GUILayout.BeginArea(new Rect((Screen.width - width) / 2, Screen.height - height - 16, width, height), GUI.skin.box);
                dialogueScroll = GUILayout.BeginScrollView(dialogueScroll);
                string role = session.Current != null && session.Current.speakers != null && page < session.Current.speakers.Length
                    ? session.Current.speakers[page] : session.Current != null && session.Current.type == "answer" ? "player" : "npc";
                GUILayout.Label(role == "player" ? "You" : role == "scene" ? "Scene" : session.Character.name, titleStyle);
                if (session.Current == null)
                {
                    GUILayout.Label("No available starting dialogue. Check the root connection and test variables.", labelStyle);
                    if (NumberedButton("Try again", 0, buttonStyle)) pendingAction = delegate { session.Start(); page = 0; };
                }
                else
                {
                    string[] pages = session.Current.text.Replace("\r\n", "\n").Split('\n');
                    GUILayout.Label(pages[page], labelStyle);
                    if (page < pages.Length - 1)
                    {
                        if (NumberedButton("Continue", 0, buttonStyle)) pendingAction = delegate { page++; dialogueScroll = Vector2.zero; };
                    }
                    else
                    {
                        if (session.Current.type == "question") GUILayout.Label("You", titleStyle);
                        List<DialogueChoice> choices = session.Options();
                        bool blocked = false;
                        for (int i = 0; i < choices.Count; i++)
                        {
                            int choiceIndex = i;
                            GUI.enabled = choices[i].Enabled;
                            if (NumberedButton(choices[i].Text, i, buttonStyle)) pendingAction = delegate { Choose(choiceIndex); };
                            blocked |= !choices[i].Enabled;
                        }
                        GUI.enabled = true;
                        if (blocked) GUILayout.Label("Some paths are locked. Use Test variables to try them.", labelStyle);
                    }
                }
                if (GUILayout.Button("Close conversation (Esc)", buttonStyle, GUILayout.MinHeight(36))) pendingAction = delegate { session = null; };
                GUILayout.EndScrollView();
                GUILayout.EndArea();
            }

            if (showVariables)
            {
                GUILayout.BeginArea(new Rect(16, 114, Mathf.Min(460, Screen.width - 32), Mathf.Min(220, Screen.height * 0.35f)), GUI.skin.box);
                variableScroll = GUILayout.BeginScrollView(variableScroll);
                GUILayout.Label("Set variables to test conditions. Fights offer simulated win/loss outcomes.", labelStyle);
                if (Variables.Count == 0) GUILayout.Label("No conditions in this dialogue.", labelStyle);
                foreach (string name in new List<string>(Variables.Keys))
                {
                    GUILayout.BeginHorizontal();
                    GUILayout.Label(name, labelStyle, GUILayout.Width(160));
                    variableInputs[name] = GUILayout.TextField(variableInputs[name]);
                    GUILayout.EndHorizontal();
                    if (Variables[name].IsNumber)
                    {
                        double number;
                        if (double.TryParse(variableInputs[name], NumberStyles.Float, CultureInfo.InvariantCulture, out number) &&
                            !double.IsNaN(number) && !double.IsInfinity(number)) Variables[name].Number = number;
                        else GUILayout.Label("Enter a finite number (use a dot for decimals).", labelStyle);
                    }
                    else Variables[name].Text = variableInputs[name];
                }
                if (GUILayout.Button("Close test variables", buttonStyle)) pendingAction = delegate { showVariables = false; };
                GUILayout.EndScrollView();
                GUILayout.EndArea();
            }
            if (pendingAction != null) pendingAction();
        }
    }
}
