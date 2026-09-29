using System;
using System.IO;
using GameDialogueMakerUnity;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace GameDialogueMakerUnity.Editor
{
    public static class PlaygroundBuilder
    {
        const string Root = "Assets/GameDialogueMaker";
        const string ScenePath = Root + "/Scenes/DialoguePlayground.unity";

        [MenuItem("Tools/Game Dialogue Maker/Create or Open Playground")]
        public static void CreateOrOpen()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            if (File.Exists(ScenePath)) { EditorSceneManager.OpenScene(ScenePath); return; }
            Create();
        }

        [MenuItem("Tools/Game Dialogue Maker/Rebuild Playground")]
        public static void Rebuild()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            if (File.Exists(ScenePath) && !EditorUtility.DisplayDialog("Rebuild playground?",
                "This replaces the generated scene, including any changes you made to it. Dialogue JSON and scripts are preserved.", "Rebuild", "Cancel")) return;
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            Create();
        }

        // Build the scene through Unity's serializer; do not hand-author scene YAML.
        public static void Create()
        {
            TextAsset asset = AssetDatabase.LoadAssetAtPath<TextAsset>(Root + "/Resources/GDMDialogue.json");
            if (asset == null) throw new InvalidOperationException("Import the complete GameDialogueMaker folder first.");
            DialogueData data = JsonUtility.FromJson<DialogueData>(asset.text);
            if (data == null || data.characters == null) throw new InvalidOperationException("Invalid GDMDialogue.json.");
            string spritePath = Root + "/Art/character.png";
            TextureImporter importer = AssetImporter.GetAtPath(spritePath) as TextureImporter;
            if (importer == null) throw new InvalidOperationException("The character PNG is missing.");
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 40;
            importer.filterMode = FilterMode.Point;
            importer.mipmapEnabled = false;
            importer.alphaIsTransparency = true;
            importer.SaveAndReimport();
            Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
            if (sprite == null) throw new InvalidOperationException("Unity could not import the character sprite.");
            Directory.CreateDirectory(Root + "/Scenes");
            AssetDatabase.Refresh();
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var root = new GameObject("Dialogue Playground");
            DialogueController controller = root.AddComponent<DialogueController>();
            controller.dialogueFile = asset;
            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.SetParent(root.transform);
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 6;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.07f, 0.09f, 0.14f);
            camera.transform.position = new Vector3(0, 0, -10);

            var player = MakeSprite("Player", root.transform, sprite, new Vector2(-6, 3), new Color(0.35f, 0.8f, 1));
            Rigidbody2D body = player.AddComponent<Rigidbody2D>();
            body.gravityScale = 0;
            body.constraints = RigidbodyConstraints2D.FreezeRotation;
            body.interpolation = RigidbodyInterpolation2D.Interpolate;
            player.AddComponent<BoxCollider2D>();
            DialoguePlayer movement = player.AddComponent<DialoguePlayer>();
            movement.controller = controller;
            movement.followCamera = camera;
            movement.minY = -Mathf.Max(0, Mathf.CeilToInt(data.characters.Length / 4f) - 1) * 3.5f - 3;

            var npcRoot = new GameObject("NPCs");
            npcRoot.transform.SetParent(root.transform);
            for (int i = 0; i < data.characters.Length; i++)
            {
                Color color;
                if (!ColorUtility.TryParseHtmlString(data.characters[i].color, out color)) color = new Color(0.7f, 0.54f, 0.95f);
                color.r = Mathf.Max(0.35f, color.r); color.g = Mathf.Max(0.35f, color.g); color.b = Mathf.Max(0.35f, color.b);
                GameObject npc = MakeSprite("NPC_" + (i + 1), npcRoot.transform, sprite,
                    new Vector2(-6 + (i % 4) * 4, -(i / 4) * 3.5f), color);
                npc.AddComponent<BoxCollider2D>().isTrigger = true;
                DialogueNpc contact = npc.AddComponent<DialogueNpc>();
                contact.characterIndex = i;
                contact.displayName = data.characters[i].name;
                contact.controller = controller;
            }
            if (data.demoAppleQuest)
            {
                string applePath = Root + "/Art/apple.png";
                var appleImporter = (TextureImporter)AssetImporter.GetAtPath(applePath);
                appleImporter.textureType = TextureImporterType.Sprite;
                appleImporter.spriteImportMode = SpriteImportMode.Single;
                appleImporter.spritePixelsPerUnit = 40;
                appleImporter.filterMode = FilterMode.Point;
                appleImporter.mipmapEnabled = false;
                appleImporter.alphaIsTransparency = true;
                appleImporter.SaveAndReimport();
                var apple = MakeSprite("Apple", root.transform, AssetDatabase.LoadAssetAtPath<Sprite>(applePath), new Vector2(2, 2), Color.white);
                apple.AddComponent<BoxCollider2D>().isTrigger = true;
                apple.AddComponent<DialogueApple>().controller = controller;
            }
            if (!EditorSceneManager.SaveScene(scene, ScenePath)) throw new IOException("Could not save the playground scene.");
            Selection.activeGameObject = player;
            Debug.Log("Dialogue playground created. Press Play and move with arrows/WASD. Touch an NPC to talk.");
        }

        static GameObject MakeSprite(string name, Transform parent, Sprite sprite, Vector2 position, Color color)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent);
            obj.transform.position = position;
            SpriteRenderer renderer = obj.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.color = color;
            return obj;
        }
    }
}
