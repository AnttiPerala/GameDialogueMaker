using UnityEngine;

namespace GameDialogueMakerUnity
{
    public class DialogueApple : MonoBehaviour
    {
        public DialogueController controller;
        bool collected;

        void OnTriggerEnter2D(Collider2D other)
        {
            DialoguePlayer player = other.GetComponent<DialoguePlayer>();
            if (collected || player == null || controller == null || player.controller != controller || controller.IsBusy) return;
            collected = true;
            controller.CollectApple();
            gameObject.SetActive(false);
        }
    }
}
