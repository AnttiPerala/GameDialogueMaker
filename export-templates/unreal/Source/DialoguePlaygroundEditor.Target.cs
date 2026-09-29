using UnrealBuildTool;
using System.Collections.Generic;
public class DialoguePlaygroundEditorTarget : TargetRules
{
    public DialoguePlaygroundEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("DialoguePlayground");
    }
}
