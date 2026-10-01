using UnityEngine;

namespace GameDialogueMakerUnity
{
    [RequireComponent(typeof(BoxCollider2D))]
    public class DialogueNpc : MonoBehaviour
    {
        public string characterId;
        public int characterIndex;
        public string displayName;
        public DialogueController controller;

        void OnTriggerEnter2D(Collider2D other)
        {
            DialoguePlayer player = other.GetComponent<DialoguePlayer>();
            if (player != null && player.controller == controller && controller != null)
            {
                if (!string.IsNullOrEmpty(characterId)) controller.OpenCharacterId(characterId);
                else controller.OpenCharacter(characterIndex);
            }
        }
    }
}
