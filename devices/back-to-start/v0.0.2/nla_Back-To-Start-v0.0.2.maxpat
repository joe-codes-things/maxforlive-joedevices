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
   440.0,
   190.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "openinpresentation": 1,
  "devicewidth": 420.0,
  "description": "Back to Start v0.0.2",
  "digest": "Map the button to Num Pad 0 to return both Arrangement positions to bar 1",
  "tags": "navigation, Arrangement, song position, key map",
  "title": "Back to Start",
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
     "text": "Back to Start",
     "patching_rect": [
      20.0,
      15.0,
      380.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      10.0,
      380.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Map to Num Pad 0. Moves the Scrub Area and Play Start Indicator to bar 1 without starting playback.",
     "patching_rect": [
      20.0,
      50.0,
      400.0,
      40.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      400.0,
      40.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "text": "Clip Editor navigation is not supported by the documented Live API.",
     "patching_rect": [
      20.0,
      95.0,
      400.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      82.0,
      400.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "live.button",
     "patching_rect": [
      150.0,
      125.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      145.0,
      106.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Back to Start",
       "parameter_shortname": "Start",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      265.0,
      125.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "js back_to_start.js",
     "patching_rect": [
      265.0,
      155.0,
      145.0,
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
      "obj-4",
      0
     ],
     "destination": [
      "obj-5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-5",
      0
     ],
     "destination": [
      "obj-6",
      0
     ]
    }
   }
  ],
  "parameters": {
   "obj-4": [
    "Back to Start",
    "Start",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "back_to_start.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}