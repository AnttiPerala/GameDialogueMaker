#pragma once
#include "CoreMinimal.h"
#include "DialogueSession.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

// Content/Dialogue/dialogue.json is the ordinary Dialogue Maker export.
namespace GDM {
inline std::string Utf8(const FString& Value) { return std::string(TCHAR_TO_UTF8(*Value)); }
inline std::string JsonId(const TSharedPtr<FJsonObject>& Object, const TCHAR* Key) {
    FString Text; if (Object->TryGetStringField(Key, Text)) return Utf8(Text);
    double Number; if (Object->TryGetNumberField(Key, Number)) return Utf8(FString::Printf(TEXT("%.0f"), Number));
    return "";
}
inline std::vector<Edge> ReadEdges(const TSharedPtr<FJsonObject>& Object, const TCHAR* Key, bool& Valid) {
    std::vector<Edge> Result;
    const TArray<TSharedPtr<FJsonValue>>* Values = nullptr;
    if (!Object->TryGetArrayField(Key, Values)) return Result;
    for (const auto& Value : *Values) {
        const auto Line = Value->AsObject();
        if (!Line.IsValid()) { Valid = false; continue; }
        Edge E; E.Target = JsonId(Line, TEXT("toNode"));
        const TArray<TSharedPtr<FJsonValue>>* Conditions = nullptr;
        if (Line->TryGetArrayField(TEXT("transitionConditions"), Conditions)) for (const auto& Raw : *Conditions) {
            const auto C = Raw->AsObject();
            if (!C.IsValid()) { Valid = false; continue; }
            Condition Condition;
            FString Name, Op;
            C->TryGetStringField(TEXT("variableName"), Name); C->TryGetStringField(TEXT("comparisonOperator"), Op);
            Condition.Name = Utf8(Name); Condition.Op = Utf8(Op);
            const auto Expected = C->TryGetField(TEXT("variableValue"));
            if (Expected.IsValid() && Expected->Type == EJson::Number) Condition.Expected = {true, Expected->AsNumber(), ""};
            else if (Expected.IsValid() && Expected->Type == EJson::String) Condition.Expected = {false, 0, Utf8(Expected->AsString())};
            else Valid = false;
            if (Condition.Name.empty() || (Op != TEXT("=") && Op != TEXT("!=") && Op != TEXT("<") && Op != TEXT(">") && Op != TEXT("<=") && Op != TEXT(">="))) Valid = false;
            C->TryGetBoolField(TEXT("waitUntilMet"), Condition.WaitUntilMet);
            E.Conditions.push_back(Condition);
        }
        Result.push_back(E);
    }
    return Result;
}
inline bool LoadDialogue(std::vector<Character>& People, bool& AppleQuest, FString& Error) {
    FString Text;
    if (!FFileHelper::LoadFileToString(Text, *(FPaths::ProjectContentDir() / TEXT("Dialogue/dialogue.json")))) {
        Error = TEXT("Cannot read Content/Dialogue/dialogue.json"); return false;
    }
    TSharedPtr<FJsonObject> Root;
    const auto Reader = TJsonReaderFactory<>::Create(Text);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid()) { Error = TEXT("Invalid dialogue.json syntax"); return false; }
    const TArray<TSharedPtr<FJsonValue>>* Characters = nullptr;
    if (!Root->TryGetArrayField(TEXT("characters"), Characters)) { Error = TEXT("dialogue.json needs a characters array"); return false; }
    std::vector<Character> Loaded;
    bool Valid = true;
    Root->TryGetBoolField(TEXT("demoAppleQuest"), AppleQuest);
    for (const auto& Raw : *Characters) {
        const auto C = Raw->AsObject();
        if (!C.IsValid()) { Error = TEXT("Invalid character"); return false; }
        Character Person; Person.Id = JsonId(C, TEXT("characterID"));
        for (const auto& Other : Loaded) if (Other.Id == Person.Id) { Error = TEXT("Duplicate character ID"); return false; }
        FString Name, Color;
        C->TryGetStringField(TEXT("characterName"), Name); C->TryGetStringField(TEXT("bgColor"), Color);
        Person.Name = Utf8(Name); Person.Color = Utf8(Color); Person.Start = ReadEdges(C, TEXT("outgoingLines"), Valid);
        const TArray<TSharedPtr<FJsonValue>>* Nodes = nullptr;
        if (C->TryGetArrayField(TEXT("dialogueNodes"), Nodes)) for (const auto& NodeValue : *Nodes) {
            const auto N = NodeValue->AsObject(); if (!N.IsValid()) continue;
            Node Node; Node.Id = JsonId(N, TEXT("dialogueID"));
            FString Type, Line; N->TryGetStringField(TEXT("dialogueType"), Type); N->TryGetStringField(TEXT("dialogueText"), Line);
            Node.Type = Utf8(Type); Node.Text = Utf8(Line); Node.Next = JsonId(N, TEXT("nextNode"));
            if (Node.Next == "-1" || Node.Next == "0") Node.Next.clear();
            Node.Edges = ReadEdges(N, TEXT("outgoingLines"), Valid);
            const TArray<TSharedPtr<FJsonValue>>* Speakers = nullptr;
            if (N->TryGetArrayField(TEXT("dialogueSpeakers"), Speakers)) for (const auto& Speaker : *Speakers) Node.Speakers.push_back(Utf8(Speaker->AsString()));
            Person.Nodes.push_back(Node);
        }
        std::map<std::string, bool> Ids;
        for (const auto& N : Person.Nodes) {
            if (N.Id.empty() || Ids.count(N.Id)) Valid = false;
            Ids[N.Id] = true;
        }
        for (const auto& E : Person.Start) if (!Ids.count(E.Target)) Valid = false;
        for (const auto& N : Person.Nodes) {
            for (const auto& E : N.Edges) if (!Ids.count(E.Target)) Valid = false;
            if (!N.Next.empty() && !Ids.count(N.Next)) Valid = false;
        }
        if (!Valid || Person.Id.empty()) { Error = TEXT("Invalid dialogue node, connection or condition in dialogue.json"); return false; }
        Loaded.push_back(Person);
    }
    People = std::move(Loaded); Error.Empty(); return true;
}
}
