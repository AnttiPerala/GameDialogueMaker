using UnityEngine;

namespace GameDialogueMakerUnity
{
    [RequireComponent(typeof(Rigidbody2D), typeof(BoxCollider2D))]
    public class DialoguePlayer : MonoBehaviour
    {
        public DialogueController controller;
        public float speed = 4.5f;
        public float minY = -3, maxY = 4.5f;
        public Camera followCamera;
        Rigidbody2D body;

        void Awake() { body = GetComponent<Rigidbody2D>(); }

        void FixedUpdate()
        {
#if UNITY_6000_0_OR_NEWER
            body.linearVelocity = Vector2.zero;
#else
            body.velocity = Vector2.zero;
#endif
            if (controller == null || controller.IsBusy) return;
            Vector2 next = body.position + DialogueInput.Movement() * speed * Time.fixedDeltaTime;
            next.x = Mathf.Clamp(next.x, -8.5f, 8.5f);
            next.y = Mathf.Clamp(next.y, minY, maxY);
            body.MovePosition(next);
        }

        void LateUpdate()
        {
            if (followCamera != null)
                followCamera.transform.position = new Vector3(0, Mathf.Clamp(transform.position.y, minY + 3, 0), -10);
        }
    }
}
