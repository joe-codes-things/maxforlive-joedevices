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
   240.0
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
  "description": "S for Solo v0.0.3",
  "digest": "Diagnostic selected-track solo control",
  "tags": "Live API, track, solo, key map, diagnostic",
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
     "text": "S for Solo - diagnostic prototype",
     "patching_rect": [
      25.0,
      20.0,
      360.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      14.0,
      500.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Click Solo first. If it works, map this control to lowercase s in Key Map Mode.",
     "patching_rect": [
      25.0,
      55.0,
      500.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      44.0,
      520.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.button",
     "patching_rect": [
      25.0,
      95.0,
      90.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      78.0,
      160.0,
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
     "id": "obj-4",
     "maxclass": "comment",
     "text": "Selected track ID (0 = none):",
     "patching_rect": [
      25.0,
      145.0,
      220.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      120.0,
      220.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "number",
     "patching_rect": [
      255.0,
      145.0,
      60.0,
      22.0
     ],
     "presentation": 1,
     "presentation_rect": [
      250.0,
      118.0,
      70.0,
      24.0
     ],
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "comment",
     "text": "Solo state reported before toggle:",
     "patching_rect": [
      25.0,
      180.0,
      245.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      152.0,
      245.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "number",
     "patching_rect": [
      275.0,
      180.0,
      60.0,
      22.0
     ],
     "presentation": 1,
     "presentation_rect": [
      270.0,
      150.0,
      70.0,
      24.0
     ],
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "comment",
     "text": "Value requested by this toggle:",
     "patching_rect": [
      25.0,
      215.0,
      235.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      184.0,
      235.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "number",
     "patching_rect": [
      265.0,
      215.0,
      60.0,
      22.0
     ],
     "presentation": 1,
     "presentation_rect": [
      260.0,
      182.0,
      70.0,
      24.0
     ],
     "numinlets": 1,
     "numoutlets": 2,
     "outlettype": [
      "",
      "bang"
     ]
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "text": "live.path live_set view",
     "patching_rect": [
      25.0,
      270.0,
      180.0,
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
     "text": "t b l",
     "patching_rect": [
      25.0,
      305.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "message",
     "text": "property selected_track",
     "patching_rect": [
      25.0,
      340.0,
      145.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "newobj",
     "text": "live.observer",
     "patching_rect": [
      185.0,
      340.0,
      85.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "newobj",
     "text": "live.object",
     "patching_rect": [
      300.0,
      340.0,
      80.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "message",
     "text": "get solo",
     "patching_rect": [
      25.0,
      375.0,
      65.0,
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
     "text": "sel 1",
     "patching_rect": [
      135.0,
      95.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "newobj",
     "text": "route solo",
     "patching_rect": [
      405.0,
      340.0,
      75.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-18",
     "maxclass": "newobj",
     "text": "!- 1",
     "patching_rect": [
      405.0,
      375.0,
      45.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-19",
     "maxclass": "newobj",
     "text": "prepend set solo",
     "patching_rect": [
      405.0,
      410.0,
      110.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-20",
     "maxclass": "newobj",
     "text": "loadbang",
     "patching_rect": [
      25.0,
      410.0,
      65.0,
      22.0
     ],
     "numinlets": 0,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-21",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      105.0,
      410.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-22",
     "maxclass": "newobj",
     "text": "route id",
     "patching_rect": [
      285.0,
      375.0,
      60.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-23",
     "maxclass": "newobj",
     "text": "print S-for-Solo-Live-API",
     "patching_rect": [
      300.0,
      410.0,
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
      1
     ],
     "destination": [
      "obj-13",
      1
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
   },
   {
    "patchline": {
     "source": [
      "obj-13",
      0
     ],
     "destination": [
      "obj-14",
      1
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
      "obj-22",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-22",
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
      "obj-3",
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
      "obj-17",
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
      "obj-7",
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
      "obj-9",
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
      "obj-19",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-19",
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
      "obj-23",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-20",
      0
     ],
     "destination": [
      "obj-21",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-21",
      0
     ],
     "destination": [
      "obj-10",
      0
     ]
    }
   }
  ],
  "dependency_cache": [],
  "autosave": 0
 }
}