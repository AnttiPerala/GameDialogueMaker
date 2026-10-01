#include "GDMPlayground.h"
#include "DialogueJson.h"
#include "Kismet/GameplayStatics.h"
#include "Camera/CameraComponent.h"
#include "Components/SphereComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/SkyLightComponent.h"
#include "Engine/DirectionalLight.h"
#include "Engine/SkyLight.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Engine/Canvas.h"
#include "InputCoreTypes.h"
#include "Misc/LexFromString.h"
#include "UObject/ConstructorHelpers.h"
#include "Widgets/SOverlay.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Input/SEditableTextBox.h"

namespace
{
FString Display(const std::string& Text) { return FString(UTF8_TO_TCHAR(Text.c_str())); }
FText Label(const std::string& Text) { return FText::FromString(Display(Text)); }
AGDMGameMode* Mode(const UWorld* World) { return World ? World->GetAuthGameMode<AGDMGameMode>() : nullptr; }
TSharedRef<SHorizontalBox> NumberedText(int32 Number, const FText& Value)
{
    return SNew(SHorizontalBox)
        + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 12, 0)
        [ SNew(STextBlock).Text(FText::AsNumber(Number)).ColorAndOpacity(FLinearColor(1, 1, 1, 0.45f)) ]
        + SHorizontalBox::Slot().FillWidth(1)
        [ SNew(STextBlock).Text(Value).AutoWrapText(true).ColorAndOpacity(FLinearColor::White) ];
}
TSharedRef<STextBlock> Text(const FText& Value)
{ return SNew(STextBlock).Text(Value).AutoWrapText(true).ColorAndOpacity(FLinearColor::White); }
}

AGDMNpc::AGDMNpc()
{
    Trigger = CreateDefaultSubobject<USphereComponent>(TEXT("ContactTrigger"));
    RootComponent = Trigger;
    Trigger->InitSphereRadius(95);
    Trigger->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
    Trigger->SetCollisionObjectType(ECC_WorldDynamic);
    Trigger->SetCollisionResponseToAllChannels(ECR_Ignore);
    Trigger->SetCollisionResponseToChannel(ECC_Pawn, ECR_Overlap);
    Trigger->SetGenerateOverlapEvents(true);
    Trigger->OnComponentBeginOverlap.AddDynamic(this, &AGDMNpc::Contact);
    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("NpcCube"));
    Mesh->SetupAttachment(RootComponent);
    Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Shape(TEXT("/Engine/BasicShapes/Cube.Cube"));
    Mesh->SetStaticMesh(Shape.Object);
}

AGDMApple::AGDMApple()
{
    Trigger = CreateDefaultSubobject<USphereComponent>(TEXT("AppleTrigger"));
    RootComponent = Trigger;
    Trigger->InitSphereRadius(45);
    Trigger->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
    Trigger->SetCollisionObjectType(ECC_WorldDynamic);
    Trigger->SetCollisionResponseToAllChannels(ECR_Ignore);
    Trigger->SetCollisionResponseToChannel(ECC_Pawn, ECR_Overlap);
    Trigger->SetGenerateOverlapEvents(true);
    Trigger->OnComponentBeginOverlap.AddDynamic(this, &AGDMApple::Contact);
}

void AGDMApple::Contact(UPrimitiveComponent*, AActor* Other, UPrimitiveComponent*, int32, bool, const FHitResult&)
{
    if (bCollected) return;
    if (AGDMPlayer* Player = Cast<AGDMPlayer>(Other))
        if (AGDMController* PC = Cast<AGDMController>(Player->GetController()))
        {
            if (PC->IsBusy()) return;
            bCollected = true;
            PC->Variables["hasApple"] = {true, 1.0, ""};
            Destroy();
        }
}

void AGDMNpc::Contact(UPrimitiveComponent*, AActor* Other, UPrimitiveComponent*, int32, bool, const FHitResult&)
{
    if (AGDMPlayer* Player = Cast<AGDMPlayer>(Other))
        if (AGDMController* PC = Cast<AGDMController>(Player->GetController())) PC->OpenCharacterById(CharacterId);
}

AGDMPlayer::AGDMPlayer()
{
    Collision = CreateDefaultSubobject<USphereComponent>(TEXT("PlayerCollision"));
    RootComponent = Collision;
    Collision->InitSphereRadius(40);
    Collision->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
    Collision->SetCollisionObjectType(ECC_Pawn);
    Collision->SetCollisionResponseToAllChannels(ECR_Ignore);
    Collision->SetCollisionResponseToChannel(ECC_WorldDynamic, ECR_Overlap);
    Collision->SetGenerateOverlapEvents(true);
    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("PlayerSphere"));
    Mesh->SetupAttachment(RootComponent);
    Mesh->SetRelativeScale3D(FVector(0.8f));
    Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Shape(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    Mesh->SetStaticMesh(Shape.Object);
    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("TopDownCamera"));
    Camera->SetupAttachment(RootComponent);
    Camera->SetRelativeLocation(FVector(0, 0, 1800));
    Camera->SetRelativeRotation(FRotator(-90, 0, 0));
    Camera->SetFieldOfView(75);
}
void AGDMPlayer::BeginPlay()
{
    Super::BeginPlay();
    SetActorLocation(FVector(400, -600, 50));
}

AGDMGameMode::AGDMGameMode()
{
    DefaultPawnClass = AGDMPlayer::StaticClass();
    PlayerControllerClass = AGDMController::StaticClass();
    HUDClass = AGDMHud::StaticClass();
    GDM::LoadDialogue(Characters, bDemoAppleQuest, DialogueError);
}
void AGDMGameMode::BeginPlay()
{
    Super::BeginPlay();
    if (!bCreateDemoWorld) {
        TArray<AActor*> Placed;
        UGameplayStatics::GetAllActorsOfClass(GetWorld(), AGDMNpc::StaticClass(), Placed);
        for (AActor* Actor : Placed) {
            AGDMNpc* Npc = Cast<AGDMNpc>(Actor); Npc->CharacterIndex = -1;
            for (int32 I = 0; I < static_cast<int32>(Characters.size()); ++I)
                if (Npc->CharacterId == Display(Characters[I].Id)) { Npc->CharacterIndex = I; break; }
            Npcs.Add(Npc);
        }
        return;
    }
    const float Rows = FMath::Max(1, FMath::DivideAndRoundUp(static_cast<int32>(Characters.size()), 4));
    AStaticMeshActor* Floor = GetWorld()->SpawnActor<AStaticMeshActor>();
    Floor->GetStaticMeshComponent()->SetMobility(EComponentMobility::Movable);
    Floor->GetStaticMeshComponent()->SetStaticMesh(LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube")));
    Floor->SetActorLocation(FVector(-(Rows - 1) * 200, 0, -20));
    Floor->SetActorScale3D(FVector(Rows * 4 + 14, 24, 0.2));
    Floor->SetActorEnableCollision(false);
    ADirectionalLight* Sun = GetWorld()->SpawnActor<ADirectionalLight>();
    Sun->GetLightComponent()->SetMobility(EComponentMobility::Movable);
    Sun->SetActorRotation(FRotator(-60, -30, 0));
    Sun->GetLightComponent()->SetIntensity(4);
    ASkyLight* Sky = GetWorld()->SpawnActor<ASkyLight>();
    Sky->GetLightComponent()->SetMobility(EComponentMobility::Movable);
    Sky->GetLightComponent()->SetIntensity(1);
    Sky->GetLightComponent()->RecaptureSky();
    if (bDemoAppleQuest) Apple = GetWorld()->SpawnActor<AGDMApple>(FVector(300, 300, 50), FRotator::ZeroRotator);
    for (int32 I = 0; I < static_cast<int32>(Characters.size()); ++I)
    {
        AGDMNpc* Npc = GetWorld()->SpawnActor<AGDMNpc>(FVector(-(I / 4) * 400, -600 + (I % 4) * 400, 50), FRotator::ZeroRotator);
        Npc->CharacterIndex = I;
        Npc->CharacterId = Display(Characters[I].Id);
        Npcs.Add(Npc);
    }
}

void AGDMController::BeginPlay()
{
    Super::BeginPlay();
    if (!IsLocalController() || !GEngine || !GEngine->GameViewport) return;
    if (const AGDMGameMode* GM = Mode(GetWorld())) Variables = GDM::Defaults(GM->Characters);
    bShowMouseCursor = true;
    FInputModeGameAndUI Input;
    Input.SetHideCursorDuringCapture(false);
    Input.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
    SetInputMode(Input);
    SAssignNew(RootWidget, SOverlay).Visibility(EVisibility::SelfHitTestInvisible)
    + SOverlay::Slot().HAlign(HAlign_Left).VAlign(VAlign_Top).Padding(16)
    [ SNew(SBorder).Padding(12).BorderBackgroundColor(FLinearColor(0.03f, 0.05f, 0.1f, 1))
      [ SNew(SVerticalBox)
        + SVerticalBox::Slot().AutoHeight().Padding(4)
        [ Text(FText::FromString(TEXT("Sphere = you | WASD / arrows: move | Touch a cube to talk"))) ]
        + SVerticalBox::Slot().AutoHeight().Padding(4)
        [ SNew(SButton).IsFocusable(false).Text(FText::FromString(TEXT("Test variables")))
          .OnClicked_Lambda([this]() { bVariables = !bVariables; RefreshVariables(); return FReply::Handled(); }) ]
      ] ]
    + SOverlay::Slot().HAlign(HAlign_Center).VAlign(VAlign_Bottom).Padding(16)
    [ SNew(SBox).WidthOverride(760).MaxDesiredHeight(340)
      .Visibility_Lambda([this]() { return Session.IsValid() ? EVisibility::Visible : EVisibility::Collapsed; })
      [ SNew(SBorder).Padding(16).BorderBackgroundColor(FLinearColor(0.03f, 0.05f, 0.1f, 1))
        [ SNew(SScrollBox) + SScrollBox::Slot() [ SAssignNew(DialogueBox, SVerticalBox) ] ] ] ]
    + SOverlay::Slot().HAlign(HAlign_Right).VAlign(VAlign_Top).Padding(16)
    [ SNew(SBox).WidthOverride(380).MaxDesiredHeight(320)
      .Visibility_Lambda([this]() { return bVariables ? EVisibility::Visible : EVisibility::Collapsed; })
      [ SNew(SBorder).Padding(16).BorderBackgroundColor(FLinearColor(0.03f, 0.05f, 0.1f, 1))
        [ SNew(SScrollBox) + SScrollBox::Slot() [ SAssignNew(VariableBox, SVerticalBox) ] ] ] ];
    GEngine->GameViewport->AddViewportWidgetContent(RootWidget.ToSharedRef());
}

void AGDMController::PlayerTick(float DeltaTime)
{
    Super::PlayerTick(DeltaTime);
    if (Session.IsValid() && !bVariables) {
        const FKey MovementKeys[] = {EKeys::Left, EKeys::Right, EKeys::Up, EKeys::Down, EKeys::W, EKeys::A, EKeys::S, EKeys::D};
        for (const FKey& Key : MovementKeys) if (WasInputKeyJustPressed(Key)) { CloseDialogue(); break; }
    }
    if (Session.IsValid() && !bVariables)
    {
        const FKey Digits[] = {EKeys::One, EKeys::Two, EKeys::Three, EKeys::Four, EKeys::Five, EKeys::Six, EKeys::Seven, EKeys::Eight, EKeys::Nine};
        const FKey Keypad[] = {EKeys::NumPadOne, EKeys::NumPadTwo, EKeys::NumPadThree, EKeys::NumPadFour, EKeys::NumPadFive, EKeys::NumPadSix, EKeys::NumPadSeven, EKeys::NumPadEight, EKeys::NumPadNine};
        const bool Modified = IsInputKeyDown(EKeys::LeftControl) || IsInputKeyDown(EKeys::RightControl) || IsInputKeyDown(EKeys::LeftAlt) || IsInputKeyDown(EKeys::RightAlt) || IsInputKeyDown(EKeys::LeftShift) || IsInputKeyDown(EKeys::RightShift) || IsInputKeyDown(EKeys::LeftCommand) || IsInputKeyDown(EKeys::RightCommand);
        if (!Modified) for (int32 I = 0; I < 9; ++I)
            if (WasInputKeyJustPressed(Digits[I]) || WasInputKeyJustPressed(Keypad[I])) { SelectOption(I); break; }
        return;
    }
    APawn* Player = GetPawn();
    if (!Player || IsBusy()) return;
    const float X = (IsInputKeyDown(EKeys::W) || IsInputKeyDown(EKeys::Up) ? 1.f : 0.f) -
        (IsInputKeyDown(EKeys::S) || IsInputKeyDown(EKeys::Down) ? 1.f : 0.f);
    const float Y = (IsInputKeyDown(EKeys::D) || IsInputKeyDown(EKeys::Right) ? 1.f : 0.f) -
        (IsInputKeyDown(EKeys::A) || IsInputKeyDown(EKeys::Left) ? 1.f : 0.f);
    FVector Position = Player->GetActorLocation() + FVector(X, Y, 0).GetClampedToMaxSize(1) * 420 * DeltaTime;
    const AGDMGameMode* GM = Mode(GetWorld());
    const int32 Rows = GM ? FMath::DivideAndRoundUp(static_cast<int32>(GM->Characters.size()), 4) : 1;
    Position.X = FMath::Clamp(Position.X, -400.f * (Rows - 1) - 350, 700.f);
    Position.Y = FMath::Clamp(Position.Y, -900.f, 900.f);
    Player->SetActorLocation(Position, true);
}

void AGDMController::OpenCharacterById(const FString& Id)
{
    const AGDMGameMode* GM = Mode(GetWorld());
    if (!GM) return;
    for (int32 I = 0; I < static_cast<int32>(GM->Characters.size()); ++I)
        if (Display(GM->Characters[I].Id) == Id) { OpenCharacter(I); return; }
}

void AGDMController::OpenCharacter(int32 Index)
{
    AGDMGameMode* GM = Mode(GetWorld());
    if (IsBusy() || !DialogueBox.IsValid() || !GM || Index < 0 || Index >= static_cast<int32>(GM->Characters.size())) return;
    if (!Sessions.Contains(Index)) Sessions.Add(Index, MakeShared<GDM::Session>(GM->Characters[Index], Variables));
    Session = Sessions[Index];
    Session->Start(); Page = 0;
    RefreshDialogue();
}
void AGDMController::CloseDialogue() { Session.Reset(); RefreshDialogue(); }

void AGDMController::SelectOption(int32 Index)
{
    if (!Session.IsValid() || bVariables || Index < 0) return;
    if (!Session->Current)
    {
        if (Index != 0) return;
        Session->Start(); Page = 0;
    }
    else
    {
        TArray<FString> Pages;
        Display(Session->Current->Text).Replace(TEXT("\r\n"), TEXT("\n")).ParseIntoArray(Pages, TEXT("\n"), false);
        if (Page + 1 < Pages.Num()) { if (Index != 0) return; ++Page; }
        else
        {
            const auto Choices = Session->Options();
            if (Index >= static_cast<int32>(Choices.size()) || !Choices[Index].Enabled) return;
            Session->Choose(Index); Page = 0;
            if (!Session->Current) Session.Reset();
        }
    }
    RefreshDialogue();
}

void AGDMController::RefreshDialogue()
{
    if (!DialogueBox.IsValid()) return;
    DialogueBox->ClearChildren();
    if (!Session.IsValid()) return;
    const std::string Role = Session->Current && Page < static_cast<int32>(Session->Current->Speakers.size())
        ? Session->Current->Speakers[Page] : Session->Current && Session->Current->Type == "answer" ? "player" : "npc";
    DialogueBox->AddSlot().AutoHeight().Padding(4)
        [ SNew(STextBlock).Text(Label(Role == "player" ? "You" : Role == "scene" ? "Scene" : Session->Person.Name))
          .ColorAndOpacity(FLinearColor(0.61f, 0.85f, 1.f)) ];
    if (!Session->Current)
    {
        DialogueBox->AddSlot().AutoHeight().Padding(4) [ Text(FText::FromString(TEXT("No available starting dialogue. Check root connections and test variables."))) ];
        DialogueBox->AddSlot().AutoHeight().Padding(4)
        [ SNew(SButton).IsFocusable(false)
          .OnClicked_Lambda([this]() { SelectOption(0); return FReply::Handled(); })
          [ NumberedText(1, FText::FromString(TEXT("Try again"))) ] ];
    }
    else
    {
        TArray<FString> Pages;
        Display(Session->Current->Text).Replace(TEXT("\r\n"), TEXT("\n")).ParseIntoArray(Pages, TEXT("\n"), false);
        if (Pages.IsEmpty()) Pages.Add(TEXT(""));
        Page = FMath::Clamp(Page, 0, Pages.Num() - 1);
        DialogueBox->AddSlot().AutoHeight().Padding(4) [ Text(FText::FromString(Pages[Page])) ];
        if (Page + 1 < Pages.Num())
            DialogueBox->AddSlot().AutoHeight().Padding(4)
            [ SNew(SButton).IsFocusable(false)
              .OnClicked_Lambda([this]() { SelectOption(0); return FReply::Handled(); })
              [ NumberedText(1, FText::FromString(TEXT("Continue"))) ] ];
        else
        {
            if (Session->Current->Type == "question")
                DialogueBox->AddSlot().AutoHeight().Padding(4)
                    [ SNew(STextBlock).Text(FText::FromString(TEXT("You"))).ColorAndOpacity(FLinearColor(0.61f, 0.85f, 1.f)) ];
            const auto Choices = Session->Options();
            for (size_t I = 0; I < Choices.size(); ++I)
                DialogueBox->AddSlot().AutoHeight().Padding(4)
                [ SNew(SButton).IsFocusable(false).IsEnabled(Choices[I].Enabled)
                  .OnClicked_Lambda([this, I]() {
                      SelectOption(static_cast<int32>(I)); return FReply::Handled(); })
                  [ NumberedText(static_cast<int32>(I) + 1, Label(Choices[I].Text)) ] ];
        }
    }
    DialogueBox->AddSlot().AutoHeight().Padding(4)
    [ SNew(SButton).IsFocusable(false).Text(FText::FromString(TEXT("Close conversation")))
      .OnClicked_Lambda([this]() { CloseDialogue(); return FReply::Handled(); }) ];
}

void AGDMController::RefreshVariables()
{
    if (!VariableBox.IsValid()) return;
    VariableBox->ClearChildren();
    VariableBox->AddSlot().AutoHeight().Padding(4)
    [ Text(FText::FromString(TEXT("Set condition variables; press Enter to apply. Numbers start at 0, strings empty."))) ];
    for (const auto& Pair : Variables)
    {
        const std::string Name = Pair.first;
        VariableBox->AddSlot().AutoHeight().Padding(4) [ Text(Label(Name)) ];
        VariableBox->AddSlot().AutoHeight().Padding(4)
        [ SNew(SEditableTextBox).Text(Pair.second.Numeric ? FText::FromString(FString::SanitizeFloat(Pair.second.Number)) : Label(Pair.second.Text))
          .OnTextCommitted_Lambda([this, Name](const FText& Value, ETextCommit::Type) {
              auto& Target = Variables[Name];
              if (Target.Numeric) {
                  double Number;
                  if (LexTryParseString(Number, *Value.ToString()) && FMath::IsFinite(Number)) Target.Number = Number;
              } else Target.Text = TCHAR_TO_UTF8(*Value.ToString());
              RefreshDialogue();
          }) ];
    }
    VariableBox->AddSlot().AutoHeight().Padding(4)
    [ SNew(SButton).IsFocusable(false).Text(FText::FromString(TEXT("Close test variables")))
      .OnClicked_Lambda([this]() { bVariables = false; return FReply::Handled(); }) ];
}

void AGDMController::EndPlay(const EEndPlayReason::Type Reason)
{
    if (RootWidget.IsValid() && GEngine && GEngine->GameViewport)
        GEngine->GameViewport->RemoveViewportWidgetContent(RootWidget.ToSharedRef());
    RootWidget.Reset(); DialogueBox.Reset(); VariableBox.Reset(); Session.Reset();
    Super::EndPlay(Reason);
}

void AGDMHud::DrawHUD()
{
    Super::DrawHUD();
    AGDMGameMode* GM = Mode(GetWorld());
    if (!Canvas || !PlayerOwner || !GM) return;
    if (!GM->DialogueError.IsEmpty()) DrawText(GM->DialogueError, FLinearColor::Red, 28, 160);
    if (GM->bDemoAppleQuest)
    {
        DrawText(IsValid(GM->Apple) ? TEXT("Apple: not collected. Talk to Mira, then touch the apple.") : TEXT("Apple collected! Return to Mira."),
            FLinearColor::White, 28, 120);
        FVector2D Point;
        if (IsValid(GM->Apple) && !GM->Apple->bCollected && PlayerOwner->ProjectWorldLocationToScreen(GM->Apple->GetActorLocation(), Point, true))
        {
            // Pixel-art billboard at the native pickup actor's world position.
            // No external texture or material dependency when packaging the project.
            const FLinearColor Red(0.91f, 0.18f, 0.14f), Green(0.18f, 0.75f, 0.31f);
            DrawRect(Red, Point.X - 14, Point.Y - 8, 28, 22);
            DrawRect(Red, Point.X - 10, Point.Y - 12, 20, 30);
            DrawRect(FLinearColor(0.46f, 0.29f, 0.14f), Point.X - 2, Point.Y - 21, 4, 12);
            DrawRect(Green, Point.X + 2, Point.Y - 22, 12, 6);
            DrawRect(Green, Point.X - 12, Point.Y - 24, 10, 5);
            DrawRect(FLinearColor(1.f, 0.58f, 0.49f), Point.X - 9, Point.Y - 5, 4, 9);
        }
    }
    for (AGDMNpc* Npc : GM->Npcs)
    {
        FVector2D Point;
        if (!IsValid(Npc) || Npc->CharacterIndex < 0 || Npc->CharacterIndex >= static_cast<int32>(GM->Characters.size())) continue;
        if (PlayerOwner->ProjectWorldLocationToScreen(Npc->GetActorLocation(), Point, true))
        {
            const auto& Person = GM->Characters[Npc->CharacterIndex];
            const FString Name = Display(Person.Name);
            float Width, Height; GetTextSize(Name, Width, Height);
            DrawText(Name, FLinearColor(FColor::FromHex(Display(Person.Color))), Point.X - Width / 2, Point.Y + 34);
        }
    }
}
