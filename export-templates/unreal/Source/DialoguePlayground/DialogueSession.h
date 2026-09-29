#pragma once
#include <string>
#include <vector>
#include <map>

// Engine-independent traversal. All strings are UTF-8, including variable names.
namespace GDM
{
struct Value { bool Numeric = false; double Number = 0; std::string Text; };
struct Condition { std::string Name, Op; Value Expected; };
struct Edge { std::string Target; std::vector<Condition> Conditions; };
struct Node { std::string Id, Type, Text, Next; std::vector<Edge> Edges; };
struct Character { std::string Name, Color; std::vector<Edge> Start; std::vector<Node> Nodes; };
using Variables = std::map<std::string, Value>;
struct Choice { std::string Text; bool Enabled; const Node* Answer; std::string Target; };

class Session
{
public:
    const Character& Person;
    Variables& Vars;
    const Node* Current = nullptr;
    Session(const Character& InPerson, Variables& InVars) : Person(InPerson), Vars(InVars) {}
    const Node* Find(const std::string& Id) const
    { for (const auto& N : Person.Nodes) if (N.Id == Id) return &N; return nullptr; }
    const Node* Go(const std::string& Id) { return Current = Find(Id); }
    bool Allows(const Edge& E) const
    {
        for (const auto& C : E.Conditions)
        {
            const auto It = Vars.find(C.Name);
            const bool Same = It != Vars.end() && It->second.Numeric == C.Expected.Numeric;
            int Compare = 0;
            if (Same) Compare = C.Expected.Numeric ?
                (It->second.Number > C.Expected.Number ? 1 : It->second.Number < C.Expected.Number ? -1 : 0) :
                It->second.Text.compare(C.Expected.Text);
            bool Pass = false;
            if (C.Op == "=") Pass = Same && Compare == 0;
            else if (C.Op == "!=") Pass = !Same || Compare != 0;
            else if (C.Op == "<") Pass = Same && Compare < 0;
            else if (C.Op == ">") Pass = Same && Compare > 0;
            else if (C.Op == "<=") Pass = Same && Compare <= 0;
            else if (C.Op == ">=") Pass = Same && Compare >= 0;
            if (!Pass) return false;
        }
        return true;
    }
    const Node* Start()
    { Current = nullptr; for (const auto& E : Person.Start) if (Allows(E)) return Go(E.Target); return Current; }
    bool CanAdvance(const Node& N) const
    { if (N.Edges.empty()) return true; for (const auto& E : N.Edges) if (Allows(E)) return true; return false; }
    const Node* Advance(const Node& N)
    { for (const auto& E : N.Edges) if (Allows(E)) return Go(E.Target); return N.Edges.empty() ? Go(N.Next) : Current; }
    std::vector<Choice> Options() const
    {
        std::vector<Choice> Result;
        if (!Current) return Result;
        if (Current->Type == "question")
        {
            for (const auto& E : Current->Edges)
            {
                const Node* Answer = Find(E.Target);
                if (Answer) Result.push_back({Answer->Text, Allows(E) && CanAdvance(*Answer), Answer, ""});
            }
        }
        else if (Current->Type == "fight")
        {
            for (size_t I = 0; I < Current->Edges.size(); ++I)
                Result.push_back({I == 0 ? "Win the fight" : I == 1 ? "Lose the fight" : "Outcome " + std::to_string(I + 1),
                    Allows(Current->Edges[I]), nullptr, Current->Edges[I].Target});
        }
        else Result.push_back({Current->Edges.empty() && Current->Next.empty() ? "Finish" : "Continue", CanAdvance(*Current), Current, ""});
        return Result;
    }
    const Node* Choose(size_t Index)
    {
        const auto Choices = Options();
        if (Index >= Choices.size() || !Choices[Index].Enabled) return Current;
        const auto& C = Choices[Index];
        return C.Answer ? Advance(*C.Answer) : Go(C.Target);
    }
};

inline Variables Defaults(const std::vector<Character>& People)
{
    Variables Result;
    const auto Add = [&Result](const std::vector<Edge>& Edges) {
        for (const auto& E : Edges) for (const auto& C : E.Conditions)
            if (!Result.count(C.Name)) Result[C.Name] = {C.Expected.Numeric, 0, ""};
    };
    for (const auto& P : People) { Add(P.Start); for (const auto& N : P.Nodes) Add(N.Edges); }
    return Result;
}
}
