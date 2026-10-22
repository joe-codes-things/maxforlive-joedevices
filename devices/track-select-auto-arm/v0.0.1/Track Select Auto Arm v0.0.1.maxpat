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
  "description": "Track Select Auto Arm v0.0.1",
  "digest": "Track selection auto-arm for Ableton Live",
  "tags": "Live API, track, arm",
  "title": "Track Select Auto Arm",
  "default_fontsize": 12.0,
  "default_fontface": 0,
  "default_fontname": "Arial",
  "gridonopen": 1,
  "gridsize": [
   15.0,
   15.0
  ],
  "gridsnaponopen": 1,
  "objectsnaponopen": 1,
  "boxes": [
   {
    "box": {
     "id": "obj-1",
     "maxclass": "comment",
     "text": "Track Select Auto Arm",
     "patching_rect": [
      30.0,
      25.0,
      240.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      16.0,
      360.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Automatically arm the selected track when it can be armed.",
     "patching_rect": [
      30.0,
      55.0,
      420.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      48.0,
      440.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "text": "Audio passes directly through unchanged. Other tracks' arm states are left alone.",
     "patching_rect": [
      30.0,
      80.0,
      500.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      76.0,
      500.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "newobj",
     "text": "plugin~",
     "patching_rect": [
      30.0,
      135.0,
      60.0,
      22.0
     ],
     "numinlets": 0,
     "numoutlets": 4,
     "outlettype": [
      "signal",
      "signal",
      "signal",
      "signal"
     ]
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "plugout~",
     "patching_rect": [
      160.0,
      135.0,
      70.0,
      22.0
     ],
     "numinlets": 4,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "live.path live_set view",
     "patching_rect": [
      30.0,
      190.0,
      240.0,
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
     "text": "t b l",
     "patching_rect": [
      30.0,
      225.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "message",
     "text": "property selected_track",
     "patching_rect": [
      30.0,
      260.0,
      120.0,
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
     "text": "live.observer",
     "patching_rect": [
      170.0,
      260.0,
      75.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "text": "t b l",
     "patching_rect": [
      275.0,
      260.0,
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
     "text": "live.object",
     "patching_rect": [
      275.0,
      300.0,
      45.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "message",
     "text": "get can_be_armed",
     "patching_rect": [
      275.0,
      335.0,
      120.0,
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
     "text": "sel 1",
     "patching_rect": [
      365.0,
      300.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "message",
     "text": "get arm",
     "patching_rect": [
      365.0,
      335.0,
      65.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "newobj",
     "text": "sel 0",
     "patching_rect": [
      455.0,
      335.0,
      80.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-16",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      30.0,
      300.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "message",
     "text": "set arm 1",
     "patching_rect": [
      110.0,
      300.0,
      65.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-18",
     "maxclass": "newobj",
     "text": "loadbang",
     "patching_rect": [
      30.0,
      335.0,
      65.0,
      22.0
     ],
     "numinlets": 0,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-19",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      110.0,
      335.0,
      65.0,
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
     "text": "route can_be_armed arm",
     "patching_rect": [
      340.0,
      260.0,
      170.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 3
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
      "obj-4",
      1
     ],
     "destination": [
      "obj-5",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-4",
      2
     ],
     "destination": [
      "obj-5",
      2
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-4",
      3
     ],
     "destination": [
      "obj-5",
      3
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
      1
     ],
     "destination": [
      "obj-9",
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
      "obj-11",
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
      "obj-20",
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
      "obj-13",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-20",
      1
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
      "obj-13",
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
      "obj-11",
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
      "obj-11",
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