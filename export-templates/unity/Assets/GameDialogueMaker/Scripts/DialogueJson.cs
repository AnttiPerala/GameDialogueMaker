using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace GameDialogueMakerUnity
{
    // Uses Unity's official com.unity.nuget.newtonsoft-json package.
    // Read the exact plain JSON export; no generated intermediate asset is required.
    public static class DialogueJson
    {
        static IEnumerable<JToken> Items(JToken token) { return token == null ? Enumerable.Empty<JToken>() : token.Children(); }
        static string Id(JToken value) { return value == null ? "" : value.ToString(); }
        static EdgeData[] Edges(JToken lines)
        {
            return Items(lines).Select(line => new EdgeData { target = Id(line["toNode"]),
                conditions = Items(line["transitionConditions"]).Select(c => {
                    JToken value = c["variableValue"];
                    bool number = value != null && (value.Type == JTokenType.Integer || value.Type == JTokenType.Float);
                    if (!number && (value == null || value.Type != JTokenType.String)) throw new Exception("Condition values must be numbers or text.");
                    return new ConditionData { name = (string)c["variableName"], op = (string)c["comparisonOperator"],
                        kind = number ? "number" : "text", number = number ? (double)value : 0,
                        text = number ? "" : (string)value, waitUntilMet = (bool?)c["waitUntilMet"] ?? true };
                }).ToArray() }).ToArray();
        }
        public static DialogueData Parse(string json)
        {
            JObject source = JObject.Parse(json);
            if (!(source["characters"] is JArray)) throw new Exception("dialogue.json needs a characters array.");
            var ids = new HashSet<string>();
            var characters = Items(source["characters"]).Select(c => {
                string id = Id(c["characterID"]);
                if (id == "" || !ids.Add(id)) throw new Exception("Character IDs must be present and unique.");
                var character = new CharacterData { id = id, name = (string)c["characterName"] ?? "Unnamed character",
                    color = (string)c["bgColor"] ?? "#b68af7", start = Edges(c["outgoingLines"]),
                    nodes = Items(c["dialogueNodes"]).Select(n => new NodeData {
                        id = Id(n["dialogueID"]), type = (string)n["dialogueType"], text = (string)n["dialogueText"] ?? "",
                        speakers = Items(n["dialogueSpeakers"]).Select(x => (string)x).ToArray(),
                        next = (int?)n["nextNode"] > 0 ? Id(n["nextNode"]) : null, edges = Edges(n["outgoingLines"])
                    }).ToArray() };
                var nodeIds = new HashSet<string>(character.nodes.Select(n => n.id));
                if (nodeIds.Count != character.nodes.Length) throw new Exception("Duplicate dialogue node in " + character.name);
                foreach (EdgeData edge in character.start.Concat(character.nodes.SelectMany(n => n.edges)))
                    if (!nodeIds.Contains(edge.target)) throw new Exception("Missing dialogue node " + edge.target);
                foreach (NodeData node in character.nodes)
                    if (node.next != null && !nodeIds.Contains(node.next)) throw new Exception("Missing Next node " + node.next);
                return character;
            }).ToArray();
            return new DialogueData { demoAppleQuest = (bool?)source["demoAppleQuest"] ?? false, characters = characters };
        }
    }
}
