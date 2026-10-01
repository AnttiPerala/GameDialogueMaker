#include "DialogueData.h"
#include <cassert>
#include <iostream>
#include <cmath>
int main()
{
    auto People = GDM::MakeCharacters();
    if (GDM::DemoAppleQuest())
    {
        auto Vars = GDM::Defaults(People);
        assert(Vars["hasApple"].Numeric && Vars["hasApple"].Number == 0);
        GDM::Session Mira(People[0], Vars);
        assert(Mira.Start()->Id == "200");
        assert(!Mira.Choose(0));
        assert(Mira.Start()->Id == "200");
        Vars["hasApple"] = {true, 1.0, ""};
        assert(GDM::Session(People[0], Vars).Start()->Id == "210");
        std::cout << "UNREAL_APPLE_PASS\n";
        return 0;
    }
    assert(People.size() == 2);
    assert(People[0].Name == u8"Mira / 森 \"Hello\"");
    assert(People[1].Name == People[0].Name);
    auto Vars = GDM::Defaults(People);
    assert(Vars["keys"].Numeric && Vars["keys"].Number == 0);
    GDM::Session S(People[0], Vars);
    assert(S.Start()->Id == "10");
    assert(S.Current->Text.find('\n') != std::string::npos);
    assert(S.Choose(0)->Id == "20");
    assert(S.Options().size() == 3 && !S.Options()[2].Enabled);
    assert(S.Choose(2)->Id == "20");
    assert(S.Choose(1000)->Id == "20");
    assert(S.Choose(0)->Id == "50");
    assert(S.Choose(1)->Id == "70");
    assert(S.Choose(0)->Id == "10");
    S.Go("50"); assert(S.Choose(0)->Id == "60");
    assert(!S.Choose(0));
    S.Go("20"); assert(S.Choose(1)->Id == "60");
    Vars["keys"].Number = 1;
    S.Go("20"); assert(S.Options()[2].Enabled && S.Choose(2)->Id == "60");
    assert(!GDM::Session(People[1], Vars).Start());
    GDM::Edge E {"10", {{"keys", ">=", {true, 1, ""}}, {"route", "=", {false, 0, u8"forest 森"}}}};
    assert(!S.Allows(E));
    Vars["route"] = {false, 0, u8"forest 森"};
    assert(S.Allows(E));
    Vars["keys"] = {false, 0, "1"};
    assert(!S.Allows(E));
    People[0].Start = {E}; assert(!S.Start());
    Vars["keys"] = {true, 1, ""}; assert(S.Start()->Id == "10");
    const char* Ops[] = {"=", "!=", "<", ">", "<=", ">="};
    bool Expected[] = {true, false, false, false, true, true};
    for (int I = 0; I < 6; ++I) { E.Conditions[0].Op = Ops[I]; assert(S.Allows(E) == Expected[I]); }
    // This node is added by the JS test: compile and round-trip hostile text and large doubles.
    const auto* Escaped = S.Find("90");
    assert(Escaped && Escaped->Text == u8"\"}; #include <evil> \\n 😀");
    assert(Escaped->Edges[0].Conditions[0].Expected.Number == 1e20);
    assert(Escaped->Edges[0].Conditions[1].Expected.Number == -1.23456789e-100);
    S.Go("90");
    assert(!S.Options()[0].Enabled && S.Choose(0)->Id == "90");
    auto& Request = People[0].Nodes[5];
    Request.Edges = {{"70", {{"apple", "=", {true, 1, ""}, true}}}};
    Vars["apple"] = {true, 0, ""};
    S.Go("60"); assert(S.Start()->Id == "60");
    Vars["apple"].Number = 1; assert(S.Start()->Id == "70");
    assert(S.Start()->Id == "10");
    Request.Edges[0].Conditions[0].WaitUntilMet = false; Vars["apple"].Number = 0;
    S.Go("60"); assert(S.Start()->Id == "10");
    std::cout << "UNREAL_SESSION_PASS\n";
}
