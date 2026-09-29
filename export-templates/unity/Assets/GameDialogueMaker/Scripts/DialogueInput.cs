using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace GameDialogueMakerUnity
{
    public static class DialogueInput
    {
        public static Vector2 Movement()
        {
#if ENABLE_INPUT_SYSTEM
            Keyboard keyboard = Keyboard.current;
            if (keyboard == null) return Vector2.zero;
            float x = (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed ? 1 : 0) -
                (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed ? 1 : 0);
            float y = (keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed ? 1 : 0) -
                (keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed ? 1 : 0);
#else
            float x = (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow) ? 1 : 0) -
                (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow) ? 1 : 0);
            float y = (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow) ? 1 : 0) -
                (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow) ? 1 : 0);
#endif
            return Vector2.ClampMagnitude(new Vector2(x, y), 1);
        }

        public static bool ClosePressed()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.Escape);
#endif
        }
    }
}
