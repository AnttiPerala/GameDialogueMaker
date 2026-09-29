using System;
using System.IO;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using GameDialogueMakerUnity;

class UnitySessionSmoke
{
    static void Check(bool value, string message) { if (!value) throw new Exception(message); }
    static void Main(string[] args)
    {
        DialogueData data = new JavaScriptSerializer().Deserialize<DialogueData>(File.ReadAllText(args[0]));
        var variables = new Dictionary<string, VariableValue>();
        if (data.demoAppleQuest)
        {
            variables["hasApple"] = VariableValue.Numeric(0);
            var mira = new DialogueSession(data.characters[0], variables);
            Check(mira.Start().id == "200", "Mira requests an apple before pickup");
            Check(mira.Choose(0) == null, "request finishes");
            Check(mira.Start().id == "200", "return without apple still requests it");
            variables["hasApple"] = VariableValue.Numeric(1);
            Check(new DialogueSession(data.characters[0], variables).Start().id == "210", "pickup unlocks Mira thank you");
            Console.WriteLine("UNITY_APPLE_PASS");
            return;
        }
        variables["keys"] = VariableValue.Numeric(0);
        var session = new DialogueSession(data.characters[0], variables);
        Check(session.Start().id == "10", "root");
        Check(session.Current.text.Contains("\n"), "multiline preserved");
        Check(session.Choose(0).id == "20", "line to question");
        Check(session.Options().Count == 3 && !session.Options()[2].Enabled, "locked answer");
        Check(session.Choose(2).id == "20", "disabled choice stays");
        Check(session.Choose(0).id == "50", "answer to fight");
        Check(session.Choose(1).id == "70", "loss");
        Check(session.Choose(0).id == "10", "next loop");
        session.Go("50"); Check(session.Choose(0).id == "60", "win");
        Check(session.Choose(0) == null, "terminal");
        session.Go("20"); Check(session.Choose(1).id == "60", "answer next jump");
        session.Go("20"); variables["keys"] = VariableValue.Numeric(1);
        Check(session.Options()[2].Enabled && session.Choose(2).id == "60", "unlock answer");
        Check(new DialogueSession(data.characters[1], variables).Start() == null, "empty character");
        var edge = new EdgeData { target = "10", conditions = new [] {
            new ConditionData { name = "keys", kind = "number", op = ">=", number = 1 },
            new ConditionData { name = "route", kind = "text", op = "=", text = "forest 森" }
        }};
        Check(!session.Allows(edge), "all conditions must pass");
        variables["route"] = VariableValue.String("forest 森");
        Check(session.Allows(edge), "text and numeric conditions");
        variables["keys"] = VariableValue.String("1");
        Check(!session.Allows(edge), "no string number coercion");
        data.characters[0].start = new [] { edge };
        Check(session.Start() == null, "blocked root");
        variables["keys"] = VariableValue.Numeric(1);
        Check(session.Start().id == "10", "retry root");
        string[] ops = { "=", "!=", "<", ">", "<=", ">=" };
        bool[] expected = { true, false, false, false, true, true };
        for (int i = 0; i < ops.Length; i++) {
            edge.conditions[0].op = ops[i];
            Check(session.Allows(edge) == expected[i], "operator " + ops[i]);
        }
        Console.WriteLine("UNITY_SESSION_PASS");
    }
}
