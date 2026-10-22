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
   560.0,
   360.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "bglocked": 0,
  "openinpresentation": 1,
  "devicewidth": 560.0,
  "description": "S for Solo v0.0.1",
  "digest": "Map a Live control to solo the primary selected track",
  "tags": "Live API, track, solo, key map",
  "title": "S for Solo",
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
     "text": "S for Solo",
     "patching_rect": [
      25.0,
      20.0,
      220.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      14.0,
      260.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Map this momentary control to lowercase s in Live's Key Map Mode.",
     "patching_rect": [
      25.0,
      55.0,
      480.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      44.0,
      500.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "text": "Prototype: toggles solo on the primary selected track only.",
     "patching_rect": [
      25.0,
      80.0,
      460.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      70.0,
      500.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "live.button",
     "patching_rect": [
      25.0,
      120.0,
      90.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      105.0,
      180.0,
      28.0
     ],
     "parameter_enable": 1,
     "mode": 1,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Solo Selected Track",
       "parameter_shortname": "Solo",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     }
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "sel 1",
     "patching_rect": [
      145.0,
      120.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "live.path live_set view",
     "patching_rect": [
      25.0,
      180.0,
      150.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "newobj",
     "text": "live.object",
     "patching_rect": [
      210.0,
      180.0,
      80.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "message",
     "text": "get selected_track",
     "patching_rect": [
      145.0,
      150.0,
      125.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "newobj",
     "text": "route selected_track",
     "patching_rect": [
      315.0,
      180.0,
      125.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "text": "t b l",
     "patching_rect": [
      315.0,
      215.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      210.0,
      250.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "newobj",
     "text": "live.object",
     "patching_rect": [
      315.0,
      250.0,
      80.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "message",
     "text": "get solo",
     "patching_rect": [
      210.0,
      285.0,
      65.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "newobj",
     "text": "route solo",
     "patching_rect": [
      315.0,
      285.0,
      75.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "newobj",
     "text": "!- 1",
     "patching_rect": [
      415.0,
      285.0,
      45.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-16",
     "maxclass": "newobj",
     "text": "prepend set solo",
     "patching_rect": [
      415.0,
      320.0,
      110.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "newobj",
     "text": "loadbang",
     "patching_rect": [
      25.0,
      150.0,
      65.0,
      22.0
     ],
     "numinlets": 0,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-18",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      105.0,
      150.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
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
      "obj-8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
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
      "obj-6",
      0
     ],
     "destination": [
      "obj-7",
      1
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
      "obj-9",
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
      1
     ],
     "destination": [
      "obj-12",
      1
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
      "obj-13",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-13",
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
      "obj-14",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      0
     ],
     "destination": [
      "obj-15",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-15",
      0
     ],
     "destination": [
      "obj-16",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-16",
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
      "obj-17",
      0
     ],
     "destination": [
      "obj-18",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-18",
      0
     ],
     "destination": [
      "obj-6",
      0
     ]
    }
   }
  ],
  "dependency_cache": [],
  "autosave": 0
 }
}