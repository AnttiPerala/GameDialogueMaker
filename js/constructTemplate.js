// Structural defaults derived from the supplied Construct r327 project.
const constructTemplate = {
  "project": {
    "projectFormatVersion": 1,
    "savedWithRelease": 32703,
    "name": "Dialogue Playground",
    "runtime": "c3",
    "useWorker": "dom",
    "bundleAddons": false,
    "usedAddons": [
      {
        "type": "plugin",
        "id": "Keyboard",
        "name": "Keyboard",
        "author": "Scirra",
        "bundled": false
      },
      {
        "type": "plugin",
        "id": "Sprite",
        "name": "Sprite",
        "author": "Scirra",
        "bundled": false
      },
      {
        "type": "plugin",
        "id": "Text",
        "name": "Text",
        "author": "Scirra",
        "bundled": false
      }
    ],
    "uniqueId": "gdmplayground",
    "objectTypes": {
      "items": [],
      "subfolders": []
    },
    "autosaveData": null,
    "containers": [],
    "families": {
      "items": [],
      "subfolders": []
    },
    "layouts": {
      "items": [],
      "subfolders": []
    },
    "eventSheets": {
      "items": [],
      "subfolders": []
    },
    "rootFileFolders": {
      "script": {
        "items": [],
        "subfolders": []
      },
      "sound": {
        "items": [],
        "subfolders": []
      },
      "music": {
        "items": [],
        "subfolders": []
      },
      "video": {
        "items": [],
        "subfolders": []
      },
      "font": {
        "items": [],
        "subfolders": []
      },
      "icon": {
        "items": [],
        "subfolders": []
      },
      "general": {
        "items": [],
        "subfolders": []
      }
    },
    "timelines": {
      "items": [],
      "subfolders": []
    },
    "properties": {
      "description": "",
      "version": "1.0.0.0",
      "author": "",
      "authorEmail": "",
      "authorWebsite": "",
      "appId": "",
      "pixelRounding": false,
      "zAxisScale": "normalized",
      "fov": 0.7853981633974483,
      "useLoaderLayout": false,
      "fullscreenMode": "letterbox-scale",
      "fullscreenQuality": "high",
      "viewportFit": "auto",
      "backgroundColor": [
        0,
        0,
        0,
        0
      ],
      "splashColor": [
        1,
        1,
        1,
        0
      ],
      "useThemeColor": false,
      "themeColor": [
        1,
        1,
        1,
        0
      ],
      "orientations": "any",
      "webgpu": "auto",
      "gpuPreference": "high-performance",
      "scriptsType": "module",
      "framerateMode": "vsync",
      "compositingMode": "standard",
      "sampling": "linear",
      "downscaling": "medium",
      "renderingMode": "auto",
      "anisotropicFiltering": "auto",
      "zNear": 1,
      "zFar": 10000,
      "maxSpriteSheetSize": 2048,
      "loaderStyle": "none",
      "preloadSounds": true,
      "cordovaiOSScheme": "app",
      "cordovaAndroidScheme": "https",
      "autoReloadScriptsOnPreview": false,
      "exportFileStructure": "folders"
    },
    "viewportWidth": 960,
    "viewportHeight": 640,
    "firstLayout": null
  },
  "layout": {
    "name": "Dialogue Playground",
    "layers": [
      {
        "name": "Characters",
        "overriden": 0,
        "subLayers": [],
        "instances": [],
        "sid": 792995870268916,
        "effectTypes": [],
        "isInitiallyVisible": true,
        "isInitiallyInteractive": true,
        "color": [
          1,
          1,
          1,
          1
        ],
        "backgroundColor": [
          0.07,
          0.09,
          0.14,
          1
        ],
        "isTransparent": false,
        "parallaxX": 1,
        "parallaxY": 1,
        "scaleRate": 1,
        "forceOwnTexture": false,
        "renderingMode": "2d",
        "drawOrder": "z-order",
        "useRenderCells": false,
        "blendMode": "normal",
        "zElevation": 0,
        "global": false
      }
    ],
    "sid": 587237299911232,
    "nonworld-instances": [],
    "effectTypes": [],
    "width": 960,
    "height": 640,
    "unboundedScrolling": false,
    "vpX": 0.5,
    "vpY": 0.5,
    "projection": "perspective",
    "eventSheet": "Dialogue events"
  },
  "sprite": {
    "name": "Mike",
    "plugin-id": "Sprite",
    "sid": 832092380141846,
    "isGlobal": false,
    "instanceVariables": [],
    "behaviorTypes": [],
    "effectTypes": [],
    "animations": {
      "items": [
        {
          "frames": [
            {
              "width": 32,
              "height": 32,
              "originX": 0.5,
              "originY": 0.5,
              "originalSource": "",
              "exportFormat": "lossless",
              "exportQuality": 0.8,
              "imageSpriteId": 4570039,
              "useCollisionPoly": false,
              "duration": 1
            }
          ],
          "sid": 944135749250038,
          "name": "Default",
          "isLooping": false,
          "isPingPong": false,
          "repeatCount": 1,
          "repeatTo": 0,
          "speed": 5
        }
      ],
      "subfolders": []
    }
  },
  "spriteInstance": {
    "type": "Mike",
    "properties": {
      "initially-visible": true,
      "initial-animation": "Default",
      "initial-frame": 0,
      "enable-collisions": true,
      "live-preview": false
    },
    "uid": 4,
    "instanceVariables": {},
    "behaviors": {},
    "world": {
      "x": 84.24359893798828,
      "y": 19.067702676350045,
      "width": 16,
      "height": 16,
      "originX": 0.5,
      "originY": 0.5,
      "color": [
        1,
        1,
        1,
        1
      ],
      "angle": 0,
      "zElevation": 0
    }
  },
  "text": {
    "name": "TextDialogue",
    "plugin-id": "Text",
    "sid": 177376323756627,
    "isGlobal": false,
    "instanceVariables": [],
    "behaviorTypes": [],
    "effectTypes": []
  },
  "textInstance": {
    "type": "TextDialogue",
    "properties": {
      "text": "Text",
      "enable-bbcode": false,
      "font": "Arial",
      "size": 16,
      "line-height": 0,
      "bold": false,
      "italic": false,
      "color": [
        1,
        1,
        1,
        1
      ],
      "horizontal-alignment": "left",
      "vertical-alignment": "top",
      "wrapping": "word",
      "initially-visible": true,
      "origin": "top-left",
      "read-aloud": false
    },
    "uid": 11,
    "instanceVariables": {},
    "behaviors": {},
    "world": {
      "x": 50,
      "y": 147.76912632698094,
      "width": 209.81382918547897,
      "height": 25.443579306741867,
      "originX": 0,
      "originY": 0,
      "color": [
        1,
        1,
        1,
        1
      ],
      "angle": 0,
      "zElevation": 0
    }
  },
  "keyboard": {
    "name": "Keyboard",
    "plugin-id": "Keyboard",
    "sid": 997630167999387,
    "singleglobal-inst": {
      "type": "Keyboard",
      "properties": {},
      "uid": 10
    }
  }
};
if (typeof module !== "undefined") module.exports = constructTemplate;
