using System;
using System.Collections.Generic;

namespace GameDialogueMakerUnity
{
    // A typed runtime format for Unity's JsonUtility. The original editor JSON
    // is also included under Source/ for round-tripping into Dialogue Maker.
    [Serializable] public class DialogueData { public bool demoAppleQuest; public CharacterData[] characters; }
    [Serializable] public class CharacterData
    {
        public string id, name, color;
        public EdgeData[] start;
        public NodeData[] nodes;
    }
    [Serializable] public class NodeData
    {
        public string id, type, text, next;
        public EdgeData[] edges;
    }
    [Serializable] public class EdgeData { public string target; public ConditionData[] conditions; }
    [Serializable] public class ConditionData
    {
        public string name, op, kind, text;
        public double number;
    }

    public class VariableValue
    {
        public bool IsNumber;
        public double Number;
        public string Text;
        public static VariableValue Numeric(double value) { return new VariableValue { IsNumber = true, Number = value }; }
        public static VariableValue String(string value) { return new VariableValue { Text = value ?? "" }; }
    }

    public class DialogueChoice
    {
        public string Text;
        public bool Enabled;
        public NodeData Node;
        public string Target;
    }

    // Plain C#: traversal is testable without a Unity installation.
    public class DialogueSession
    {
        public CharacterData Character { get; private set; }
        public NodeData Current { get; private set; }
        public readonly Dictionary<string, VariableValue> Variables;
        readonly Dictionary<string, NodeData> nodes = new Dictionary<string, NodeData>();

        public DialogueSession(CharacterData character, Dictionary<string, VariableValue> variables)
        {
            Character = character;
            Variables = variables;
            foreach (NodeData node in character.nodes) nodes.Add(node.id, node);
        }

        public NodeData Go(string id)
        {
            NodeData node;
            Current = id != null && nodes.TryGetValue(id, out node) ? node : null;
            return Current;
        }

        public bool Allows(EdgeData edge)
        {
            foreach (ConditionData condition in edge.conditions)
            {
                VariableValue actual;
                bool exists = Variables.TryGetValue(condition.name, out actual);
                bool numeric = condition.kind == "number";
                bool sameType = exists && actual.IsNumber == numeric;
                int comparison = 0;
                if (sameType) comparison = numeric ? actual.Number.CompareTo(condition.number) :
                    string.Compare(actual.Text, condition.text, StringComparison.Ordinal);
                bool passes;
                switch (condition.op)
                {
                    case "=": passes = sameType && comparison == 0; break;
                    case "!=": passes = !sameType || comparison != 0; break;
                    case "<": passes = sameType && comparison < 0; break;
                    case ">": passes = sameType && comparison > 0; break;
                    case "<=": passes = sameType && comparison <= 0; break;
                    case ">=": passes = sameType && comparison >= 0; break;
                    default: passes = false; break;
                }
                if (!passes) return false;
            }
            return true;
        }

        public NodeData Start()
        {
            Current = null;
            foreach (EdgeData edge in Character.start) if (Allows(edge)) return Go(edge.target);
            return Current;
        }

        bool CanAdvance(NodeData node)
        {
            if (node.edges.Length == 0) return true;
            foreach (EdgeData edge in node.edges) if (Allows(edge)) return true;
            return false;
        }

        public NodeData Advance(NodeData node)
        {
            foreach (EdgeData edge in node.edges) if (Allows(edge)) return Go(edge.target);
            return node.edges.Length == 0 ? Go(node.next) : Current;
        }

        public List<DialogueChoice> Options()
        {
            var choices = new List<DialogueChoice>();
            if (Current == null) return choices;
            if (Current.type == "question")
            {
                foreach (EdgeData edge in Current.edges)
                {
                    NodeData answer = nodes[edge.target];
                    choices.Add(new DialogueChoice { Text = answer.text, Node = answer,
                        Enabled = Allows(edge) && CanAdvance(answer) });
                }
            }
            else if (Current.type == "fight")
            {
                for (int i = 0; i < Current.edges.Length; i++)
                    choices.Add(new DialogueChoice { Text = i == 0 ? "Win the fight" : i == 1 ? "Lose the fight" : "Outcome " + (i + 1),
                        Enabled = Allows(Current.edges[i]), Target = Current.edges[i].target });
            }
            else choices.Add(new DialogueChoice { Text = Current.edges.Length > 0 || !string.IsNullOrEmpty(Current.next) ? "Continue" : "Finish",
                Enabled = CanAdvance(Current), Node = Current });
            return choices;
        }

        public NodeData Choose(int index)
        {
            List<DialogueChoice> options = Options();
            if (index < 0 || index >= options.Count || !options[index].Enabled) return Current;
            DialogueChoice choice = options[index];
            return choice.Target != null ? Go(choice.Target) : Advance(choice.Node);
        }
    }
}
