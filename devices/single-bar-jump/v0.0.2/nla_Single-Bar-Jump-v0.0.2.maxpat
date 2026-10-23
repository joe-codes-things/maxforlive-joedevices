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
   500.0,
   255.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "openinpresentation": 1,
  "devicewidth": 480.0,
  "description": "Single Bar Jump v0.0.2",
  "digest": "Map Back to comma and Forward to period in Key Map Mode",
  "tags": "navigation, Arrangement, song position, key map",
  "title": "Single Bar Jump",
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
     "text": "Single Bar Jump",
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
     "text": "Map Back to comma (,) and Forward to period (.) in Key Map Mode.",
     "patching_rect": [
      20.0,
      50.0,
      460.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      460.0,
      24.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "text": "Moves both Arrangement positions; does not start or stop playback.",
     "patching_rect": [
      20.0,
      80.0,
      460.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      65.0,
      460.0,
      24.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "comment",
     "text": "Back",
     "patching_rect": [
      100.0,
      120.0,
      100.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      92.0,
      100.0,
      100.0,
      20.0
     ],
     "textjustification": 1
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "live.button",
     "patching_rect": [
      105.0,
      145.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      95.0,
      120.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Back One Bar",
       "parameter_shortname": "Back",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 0
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "t b",
     "patching_rect": [
      105.0,
      180.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "message",
     "text": "-1",
     "patching_rect": [
      160.0,
      180.0,
      35.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "comment",
     "text": "Forward",
     "patching_rect": [
      285.0,
      120.0,
      100.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      282.0,
      100.0,
      100.0,
      20.0
     ],
     "textjustification": 1
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "live.button",
     "patching_rect": [
      290.0,
      145.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      285.0,
      120.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Forward One Bar",
       "parameter_shortname": "Forward",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 0
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "text": "t b",
     "patching_rect": [
      290.0,
      180.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "message",
     "text": "1",
     "patching_rect": [
      345.0,
      180.0,
      35.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      205.0,
      215.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "newobj",
     "text": "js single_bar_jump.js",
     "patching_rect": [
      280.0,
      215.0,
      160.0,
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
      "obj-5",
      0
     ],
     "destination": [
      "obj-6",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-6",
      0
     ],
     "destination": [
      "obj-7",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-7",
      0
     ],
     "destination": [
      "obj-12",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-9",
      0
     ],
     "destination": [
      "obj-10",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-10",
      0
     ],
     "destination": [
      "obj-11",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-11",
      0
     ],
     "destination": [
      "obj-12",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-12",
      0
     ],
     "destination": [
      "obj-13",
      0
     ]
    }
   }
  ],
  "parameters": {
   "obj-5": [
    "Back One Bar",
    "Back",
    0
   ],
   "obj-9": [
    "Forward One Bar",
    "Forward",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "single_bar_jump.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}