{
 "patcher": {
  "fileversion": 1,
  "appversion": {
   "major": 9,
   "minor": 2,
   "revision": 0,
   "architecture": "arm64",
   "modernui": 1
  },
  "rect": [
   80.0,
   80.0,
   400.0,
   180.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "openinpresentation": 1,
  "devicewidth": 380.0,
  "description": "Toggle Live's Browser",
  "digest": "Map the button to the top-row 1 key to show or hide the Browser",
  "tags": "Live API, browser, key map",
  "title": "Show Browser",
  "default_fontsize": 12.0,
  "default_fontface": 0,
  "default_fontname": "Arial",
  "gridonopen": 1,
  "gridsize": [
   15.0,
   15.0
  ],
  "boxes": [
   {
    "box": {
     "id": "obj-1",
     "maxclass": "comment",
     "text": "Show Browser",
     "patching_rect": [
      20.0,
      15.0,
      340.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      10.0,
      340.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Map this button to the top-row 1 key in Key Map Mode, not numpad 1. Toggles Live's Browser.",
     "patching_rect": [
      20.0,
      50.0,
      360.0,
      35.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      360.0,
      35.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.button",
     "patching_rect": [
      150.0,
      110.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      145.0,
      88.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Browser",
       "parameter_shortname": "Browser",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      265.0,
      110.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "js show_browser.js",
     "patching_rect": [
      265.0,
      145.0,
      155.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   }
  ],
  "lines": [
   {
    "patchline": {
     "source": [
      "obj-3",
      0
     ],
     "destination": [
      "obj-4",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-4",
      0
     ],
     "destination": [
      "obj-5",
      0
     ]
    }
   }
  ],
  "parameters": {
   "obj-3": [
    "Browser",
    "Browser",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "show_browser.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}
