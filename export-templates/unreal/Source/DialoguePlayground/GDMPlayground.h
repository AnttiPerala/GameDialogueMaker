#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/HUD.h"
#include "DialogueSession.h"
#include "GDMPlayground.generated.h"

class USphereComponent;
class UStaticMeshComponent;
class UCameraComponent;
class SOverlay;
class SVerticalBox;

UCLASS()
class DIALOGUEPLAYGROUND_API AGDMApple : public AActor
{
    GENERATED_BODY()
public:
    AGDMApple();
    UPROPERTY(VisibleAnywhere) USphereComponent* Trigger;
    bool bCollected = false;
    UFUNCTION() void Contact(UPrimitiveComponent* Component, AActor* Other, UPrimitiveComponent* OtherComponent,
        int32 BodyIndex, bool bSweep, const FHitResult& Hit);
};

UCLASS()
class DIALOGUEPLAYGROUND_API AGDMNpc : public AActor
{
    GENERATED_BODY()
public:
    AGDMNpc();
    UPROPERTY(VisibleAnywhere) USphereComponent* Trigger;
    UPROPERTY(VisibleAnywhere) UStaticMeshComponent* Mesh;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Dialogue") FString CharacterId;
    int32 CharacterIndex = -1;
    UFUNCTION() void Contact(UPrimitiveComponent* Component, AActor* Other, UPrimitiveComponent* OtherComponent,
        int32 BodyIndex, bool bSweep, const FHitResult& Hit);
};

UCLASS()
class DIALOGUEPLAYGROUND_API AGDMPlayer : public APawn
{
    GENERATED_BODY()
public:
    AGDMPlayer();
    virtual void BeginPlay() override;
    UPROPERTY(VisibleAnywhere) USphereComponent* Collision;
    UPROPERTY(VisibleAnywhere) UStaticMeshComponent* Mesh;
    UPROPERTY(VisibleAnywhere) UCameraComponent* Camera;
};

UCLASS()
class DIALOGUEPLAYGROUND_API AGDMController : public APlayerController
{
    GENERATED_BODY()
public:
    virtual void BeginPlay() override;
    virtual void PlayerTick(float DeltaTime) override;
    virtual void EndPlay(const EEndPlayReason::Type Reason) override;
    UFUNCTION(BlueprintCallable, Category="Dialogue") void OpenCharacterById(const FString& Id);
    void OpenCharacter(int32 Index);
    bool IsBusy() const { return Session.IsValid() || bVariables; }
    GDM::Variables Variables;
private:
    TMap<int32, TSharedPtr<GDM::Session>> Sessions;
    TSharedPtr<GDM::Session> Session;
    TSharedPtr<SOverlay> RootWidget;
    TSharedPtr<SVerticalBox> DialogueBox, VariableBox;
    bool bVariables = false;
    int32 Page = 0;
    void SelectOption(int32 Index);
    void RefreshDialogue();
    void RefreshVariables();
    void CloseDialogue();
};

UCLASS()
class DIALOGUEPLAYGROUND_API AGDMHud : public AHUD
{
    GENERATED_BODY()
public:
    virtual void DrawHUD() override;
};

UCLASS()
class DIALOGUEPLAYGROUND_API AGDMGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    AGDMGameMode();
    virtual void BeginPlay() override;
    std::vector<GDM::Character> Characters;
    UPROPERTY(EditAnywhere, Category="Dialogue") bool bCreateDemoWorld = true;
    bool bDemoAppleQuest = false;
    FString DialogueError;
    UPROPERTY() TArray<AGDMNpc*> Npcs;
    UPROPERTY() AGDMApple* Apple = nullptr;
};
