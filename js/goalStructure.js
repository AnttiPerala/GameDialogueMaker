let exampleJson = {
    "scene": [
        {
            "id": 0,
            "dialogs": [
                {
                    "type": "end",
                    "nextscene": 3
                }
            ]
        },
        {
            "id": 1,
            "dialogs": [
                {
                    "char": "Youngster Joey",
                    "type": "line",
                    "line": "My Rattata is in the top percentage. Check it out!"
                },
                {
                    "type": "fight",
                    "nextscene": 12
                }
            ]
        },
        {
            "id": 2,
            "dialogs": [
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Hi there, looks like you're in another one of these dialogue system tests."
                },
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "There have been so many of these test projects now."
                },
                {
                    "char": "Jessie",
                    "type": "question",
                    "question": "Are you bored of these projects yet? I sure am.",
                    "nbanswers": 3,
                    "answer0": "Of course not!",
                    "nextscene0": 7,
                    "answer1": "Maybe a little.",
                    "nextscene1": 8,
                    "answer2": "I am so done with this.",
                    "nextscene2": 9
                }
            ]
        },
        {
            "id": 3,
            "dialogs": [
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Well, there you go. A nice little question and answer thing."
                },
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Each answer points to a different line in the JSON file so that I say something different depending on what answer you pick."
                },
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Let's go back to that first part so you can try it out."
                },
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Just remember to pick a different answer this time!"
                },
                {
                    "char": "Jessie",
                    "type": "end",
                    "nextscene": 2
                }
            ]
        },
        {
            "id": 4,
            "dialogs": [
                {
                    "char": "Steve",
                    "type": "line",
                    "line": "I don't really have much to say."
                },
                {
                    "char": "Steve",
                    "type": "line",
                    "line": "I'm just here to show you that different NPCs can have their own conversations. "
                },
                {
                    "char": "Steve",
                    "type": "line",
                    "line": "Oh. And to show you some other BBCode bits apparently. Like (stroke)Stroke Text(/stroke) and (outline=#ff0000)Outline effects.(/outline)"
                },
                {
                    "char": "Steve",
                    "type": "line",
                    "line": "(size=24)I guess those (stroke)Stroke(/stroke) and (outline=#ff0000)Outline(/outline) effects probably look better in a larger size.(/size)"
                },
                {
                    "char": "Steve",
                    "type": "line",
                    "line": "Anyway, that's all from me. Unlike Jessie over there, I've only got one set of lines to say."
                },
                {
                    "type": "end"
                }
            ]
        },
        {
            "id": 5,
            "dialogs": [
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "Oh hey! Want to talk about functions?!"
                },
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "Cool! Well, did you know, that if you map a function using a string, you can then store that string in a JSON file like the one we're using for dialogue. Then you can use another function to call the mapped function and trigger the action!"
                },
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "As an example, I'll call a function that'll show an emote above my head when you finish this line."
                },
                {
                    "char": "FunctionGuy",
                    "type": "function",
                    "function": "SpawnHeart"
                },
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "See?! Cool huh?"
                },
                {
                    "type": "end"
                }
            ]
        },
        {
            "id": 6,
            "dialogs": [
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "Back for more? Well, how about instead of functions, we talk about timelines?!"
                },
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "Just like with the function, you can store the name of a timeline in the JSON file and then call that specific timeline using a function."
                },
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "How about I go for a little walk?"
                },
                {
                    "char": "FunctionGuy",
                    "type": "timeline",
                    "timeline": "NPCWalkTest"
                },
                {
                    "char": "FunctionGuy",
                    "type": "line",
                    "line": "Tada! Now you can really start to do cool stuff during dialogues!"
                }
            ]
        },
        {
            "id": 7,
            "dialogs": [
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Oh really? Well, yeah I suppose they're good for learning new things about JSON files and stuff.",
                    "nextscene": 0
                }
            ]
        },
        {
            "id": 8,
            "dialogs": [
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "Only a little? You're doing better than me.",
                    "nextscene": 0
                }
            ]
        },
        {
            "id": 9,
            "dialogs": [
                {
                    "char": "Jessie",
                    "type": "line",
                    "line": "I get it. This is what, project #326? Just stop already.",
                    "nextscene": 0
                }
            ]
        },
        {
            "id": 10,
            "dialogs": [
                {
                    "char": "Youngster Joey",
                    "type": "line",
                    "line": "Ha! That's what you get for taking on a top percentage Rattata!",
                    "nextscene": 12
                }
            ]
        },
        {
            "id": 11,
            "dialogs": [
                {
                    "char": "Youngster Joey",
                    "type": "line",
                    "line": "But... He was top percentage...",
                    "nextscene": 12
                }
            ]
        },
        {
            "id": 12,
            "dialogs": [
                {
                    "char": "Youngster Joey",
                    "type": "line",
                    "line": "My Rattata is still the best one around."
                },
                {
                    "type": "end"
                }
            ]
        }
    ]
}